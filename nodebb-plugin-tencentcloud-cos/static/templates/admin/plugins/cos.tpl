<div class="tencentcloud-plugin">
	<div style="display:flex; flex-direction: row; justify-content: space-between; align-items: baseline;">
		<h3>腾讯云对象存储插件</h3>
 		<a href="https://openapp.qq.com/docs/NodeBB/cos.html" target="_blank">插件设置帮助</a>
	</div>
	<div class="tencentcloud-plugin-content">
		<form class="tencentcloud-plugin-form">
			<div class="checkbox">
			  自定义密钥
				<label for="isOpen" class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
					<input type="checkbox" class="mdl-switch__input" id="isOpen" name="isOpen" />
					<span class="mdl-switch__label">为该插件配置单独定义的腾讯云密钥</span>
				</label>
			</div>
			<div class="form-group">
				<label for="secretId">SecretId</label>
				<input type="password" id="secretId" name="secretId" value="{secretId}" title="SecretId" class="form-control"
						placeholder="输入腾讯云账号SecretId">
				<span class="fa fa-eye eye"></span>
			</div>
			<div class="form-group">
				<label for="secretKey">SecretKey</label>
				<input type="password" id="secretKey" name="secretKey" value="{secretKey}" title="SecretKey" class="form-control"
						placeholder="输入腾讯云账号SecretKey">
				<span class="fa fa-eye eye"></span>
			</div>
			<div class="form-group">
				<label for="bucketName">名称</label>
				<input type="text" id="bucketName" name="bucketName" value="{bucketName}" title="BucketName" class="form-control"
						placeholder="存储桶名称">
				<p class="help-block">填写您在腾讯云创建的存储桶的空间名称，<a href="https://console.cloud.tencent.com/cos5/bucket" target="_blank">未申请？点此申请</a></p>
			</div>
			<div class="form-group">
				<label for="bucketRegion">地域</label>
				<input type="text" id="bucketRegion" name="bucketRegion" value="{bucketRegion}" title="BucketName" class="form-control"
						placeholder="存储桶地域，例如ap-beijing">
				<p class="help-block">存储桶地域，一般以"ap-"开头，如ap-beijing</p>
			</div>
			<div class="form-group">
				<label for="bucketUrl">访问域名</label>
				<input type="text" id="bucketUrl" name="bucketUrl" value="{bucketUrl}" title="BucketUrl" class="form-control"
						placeholder="存储桶的访问域名">
			</div>
			<div class="form-group">
				<label for="bucketPath">存储目录</label>
				<input type="text" id="bucketPath" name="bucketPath" value="{bucketPath}" title="BucketPath" class="form-control"
						placeholder="存储目录">
				<p class="help-block">上传后的保存目录，目录前后都不需要添加分隔符"/"，根目录请留空</p>
			</div>
			<div class="form-group">
				<button id="save" class="btn btn-primary">
					保存
				</button>
			</div>
		</form>
	</div>
</div>

<script>
	$(document).ready(function () {
		// 设置switch开关状态
		var $secretId = $('#secretId'),
			$secretKey = $('#secretKey'),
	  	isOpen = {isOpen};
		if(isOpen) {
			$("label[for='isOpen']").addClass('is-checked');
			$('#isOpen').attr('checked', true);
			$secretId.attr('readonly', false);
			$secretKey.attr('readonly', false);
		} else {
			$("label[for='isOpen']").removeClass('is-checked');
			$('#isOpen').attr('checked', false);
			$secretId.attr('readonly', true);
			$secretKey.attr('readonly', true);
		}

		// 密钥开关切换
		$("#isOpen").on('change', function(e) {
			if(e.target.checked) {
				$secretId.attr('readonly', false);
				$secretKey.attr('readonly', false);
			} else {
				$secretId.attr('readonly', true);
				$secretKey.attr('readonly', true);
			}
		})

		// 输入框type变化
		$(".eye").on('click', function(e) {
			var $prev = $(this).prev();
			if($prev.attr('type') === 'password') {
				$prev.attr('type', 'text');
				$(this).removeClass('fa-eye').addClass('fa-eye-slash');
			} else {
				$prev.attr('type', 'password');
				$(this).removeClass('fa-eye-slash').addClass('fa-eye');
			}
		})

		// 腾讯云基本配置保存
		$('#save').on('click', function (e) {
			e.preventDefault();
			var data = {
				_csrf: '{csrf}'
			};
			var values = $('.tencentcloud-plugin-form').serializeArray();
			
			for (var i = 0, l = values.length; i < l; i++) {
				data[values[i].name] = values[i].value;
			}
			if(data.isOpen === 'on') {
				data.isOpen = true;
			} else {
				data.isOpen = false;
			}
			if(data.isOpen && (!data.secretId.trim() || !data.secretKey.trim())) {
				app.alertError('SecretId、SecretKey必填!');
				return false;
			}
			if(!data.bucketName.trim()) {
				app.alertError('名称必填!');
				return false;
			}
			if(!data.bucketRegion.trim()) {
				app.alertError('地域必填!');
				return false;
			}
			if(!data.bucketUrl.trim()) {
				app.alertError('访问域名必填!');
				return false;
			}
			if(data.bucketPath.length > 0 
				&& (data.bucketPath.charAt(0) === '/' || data.bucketPath.charAt(data.bucketPath.length - 1) === '/')) {
				app.alertError('存储目录前后都不需要添加分隔符"/"，根目录请留空');
				return false;
			}
			$.ajax({
        type: "POST",
        url: "{forumPath}api/admin/plugins/tencentcloud-common/tencentcloud-cos/saveConfig",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data),
        dataType: "json",
        success: function (response) {
					ajaxify.refresh();
					app.alertSuccess(response);
        },
        error: function (error) {
					app.alertError('保存失败!');
        }
    	});
		});
	});
</script>