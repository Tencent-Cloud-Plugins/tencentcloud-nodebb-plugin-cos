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

'use strict';
const nconf = require.main.require('nconf');
const { handleError, fetchConfig, saveConfig } = require.main.require('nodebb-plugin-tencentcloud-common/src/common');

// 公共模块控制器
const Controller = { 
  // 当前插件名
  pluginName: 'tencentcloud-cos',

  // 当前插件配置数据
  config: {
    isOpen: false,
    secretId: '',
    secretKey: '',
    bucketName: '',
    bucketRegion: '',
    bucketUrl: '',
    bucketPath: ''
  }
};

// 渲染配置页
Controller.renderAdmin = async (req, res) => {
  let forumPath = nconf.get('url');
  if (forumPath.split('').reverse()[0] !== '/') {
    forumPath = `${forumPath}/`;
  }

  await fetchConfig(Controller.pluginName, Controller.config);
  const data = {
    csrf: req.csrfToken(),
    isOpen: Controller.config.isOpen,
    secretId: Controller.config.secretId,
    secretKey: Controller.config.secretKey,
    bucketName: Controller.config.bucketName,
    bucketRegion: Controller.config.bucketRegion,
    bucketUrl: Controller.config.bucketUrl,
    bucketPath: Controller.config.bucketPath,
    forumPath
  };

  res.render('admin/plugins/cos', data);
};

// 保存腾讯云基础配置
Controller.saveConfig = async (req, res, next) => {
  const data = req.body;
  const newConfig = {
    isOpen: data.isOpen,
    secretId: data.secretId,
    secretKey: data.secretKey,
    bucketName: data.bucketName,
    bucketRegion: data.bucketRegion,
    bucketUrl: data.bucketUrl,
    bucketPath: data.bucketPath
  };

  await saveConfig(Controller.pluginName, newConfig);
  res.json('配置已保存!');
};

module.exports = Controller;