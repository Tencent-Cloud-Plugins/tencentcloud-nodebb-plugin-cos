/*
 * Copyright (C) 2021 Tencent Cloud.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict'

const { handleError, fetchConfig, saveConfig } = require.main.require('nodebb-plugin-tencentcloud-common/src/common');
const commonController = require.main.require('nodebb-plugin-tencentcloud-common/src/commonController');
const pkg        = require('../package.json');
const controller = require('./controller');
const COS        = require('cos-nodejs-sdk-v5');
const meta       = require.main.require('./src/meta');
const futil      = require.main.require('./src/file');
const imgutil    = require.main.require('./src/image');
const winston    = require.main.require('winston');
const uuid       = require('uuid').v4;
const fs         = require('fs');
const path       = require('path');

function newError(err) {
	if (!(err instanceof Error)) {
		err = new Error(err);
	}

	winston.error(Plugin.name + '::' + err.message);
	return err;
}

const Plugin = {
	name: 'tencentcloud-cos',

  //当前插件配置数据
	config: {
    isOpen: false,
    secretId: '',
    secretKey: '',
    bucketName: '',
    bucketRegion: '',
    bucketUrl: '',
		bucketPath: ''
  },

	//腾讯云插件中心配置
	commonConfig: {
		secretId: '',
		secretKey: ''
	},

	cos: null
}

//hook实现 static:app.load
Plugin.init = async function (params) {
	//加载配置信息
	await Plugin.loadConfig();
	Plugin.initCos();

	//设置路由
  const { router } = params;
  const hostMiddleware = params.middleware;
	const cosRoute = '/admin/plugins/tencentcloud-common/tencentcloud-cos';
  router.get(cosRoute, hostMiddleware.applyCSRF, hostMiddleware.admin.buildHeader, controller.renderAdmin);
  router.get(`/api${cosRoute}`, hostMiddleware.applyCSRF, controller.renderAdmin);
  router.post(`/api${cosRoute}/saveConfig`, controller.saveConfig);
	
  return params;
}

//获取配置信息
Plugin.loadConfig = async function () {
	await fetchConfig(Plugin.name, Plugin.config);
	await fetchConfig(commonController.pluginName, Plugin.commonConfig);
	if (!Plugin.config.isOpen) {
		Plugin.config.secretId = Plugin.commonConfig.secretId
		Plugin.config.secretKey = Plugin.commonConfig.secretKey
	}
}

//初始化腾讯云对象存储
Plugin.initCos = function () {
	Plugin.cos = new COS({
    SecretId: Plugin.config.secretId,
    SecretKey: Plugin.config.secretKey
	});
}

//hook实现 filter:uploadImage
Plugin.uploadImage = function (data, callback) {
	let image = data.image;

	if (!image) {
		throw newError('[[error:invalid-file]]');
	}

	if (!image.path) {
		throw newError('[[error:invalid-path]]');
	}

	//文件大小
	if (image.size > parseInt(meta.config.maximumFileSize, 10) * 1024) {
		throw newError("[[error:file-too-big, " + meta.config.maximumFileSize + "]]");
	}

	//文件扩展名
	const allowed = futil.allowedExtensions();
	const extension = path.extname(image.name).toLowerCase();
	if (allowed.length > 0 && (!extension || extension === '.' || !allowed.includes(extension))) {
		throw new Error(`[[error:invalid-file-type, ${allowed.join('&#44; ')}]]`);
	}

	//超过指定宽度则裁剪
	imgutil.size(image.path).then(function(imgsize) {
		if (imgsize 
			&& meta.config.resizeImageWidthThreshold 
			&& meta.config.resizeImageWidth
			&& meta.config.resizeImageQuality
			&& imgsize.width > parseInt(meta.config.resizeImageWidthThreshold, 10)) {
			imgutil.resizeImage({
				path:   image.path,
				target: image.path,
				width:  meta.config.resizeImageWidth,
				height: Math.floor(imgsize.height * parseInt(meta.config.resizeImageWidth, 10) / imgsize.width),
				quality: meta.config.quality,
			}).then(function () {
				fs.readFile(image.path, function (err, buffer) {
					Plugin.uploadToTencent(image.name, err, buffer, callback);
				});
			});
		} else {
			fs.readFile(image.path, function (err, buffer) {
				Plugin.uploadToTencent(image.name, err, buffer, callback);
			});
		}
	})
};

//hook实现 filter:uploadFile
Plugin.uploadFile = function (data, callback) {
	let file = data.file;

	if (!file) {
		throw newError('[[error:invalid-file]]');
	}

	if (!file.path) {
		throw newError('[[error:invalid-path]]');
	}

	//文件大小
	if (file.size > parseInt(meta.config.maximumFileSize, 10) * 1024) {
		throw newError("[[error:file-too-big, " + meta.config.maximumFileSize + "]]");
	}

	//文件扩展名
	const allowed = futil.allowedExtensions();
	const extension = path.extname(file.name).toLowerCase();
	if (allowed.length > 0 && (!extension || extension === '.' || !allowed.includes(extension))) {
		throw new Error(`[[error:invalid-file-type, ${allowed.join('&#44; ')}]]`);
	}

	fs.readFile(file.path, function (err, buffer) {
		Plugin.uploadToTencent(file.name, err, buffer, callback);
	});
};

//上传到腾讯云
Plugin.uploadToTencent = function (filename, err, buffer, callback) {
	if (err) {
		return callback(newError(err));
	}
	Plugin.cos.putObject({
		Bucket: Plugin.config.bucketName,
		Region: Plugin.config.bucketRegion,
		Key: Plugin.config.bucketPath + '/' + uuid() + '-' + filename,
		StorageClass: 'STANDARD',
		Body: buffer
	}, function(err, data) {
			if (err) {
				return callback(newError(err));
			}
			let url = Plugin.config.bucketRegion.startsWith('http://')
								? 'http://' + data.Location
								: 'https://' + data.Location;
			callback(null, {
				name: filename,
				url: url
			});
	});
};

Plugin.activate = async function (data) {
	if (data.id === pkg.name) {
		await Plugin.loadConfig();
		Plugin.initCos();
	}
}

Plugin.deactivate = function (data) {
	if (data.id === pkg.name) {
		Plugin.cos = null;
	}
}

module.exports = Plugin