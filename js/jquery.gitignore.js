angular.module('gitignoreApp', [])
	.controller('GitignoreController', ['$scope', '$http', '$sce', function ($scope, $http, $sce) {

		var oss = [
			'Linux',
			'OSX',
			'Windows'
		];

		var langs = [
			'Actionscript',
			'Ada',
			'Agda',
			'C++',
			'C',
			'Clojure',
			'CommonLisp',
			'Dart',
			'Erlang',
			'Fortran',
			'Go',
			'Java',
			'Objective-C',
			'Perl',
			'Python',
			'Ruby',
			'Scala',
			'Swift',
		];

		var editors = [
			'Cloud9',
			'DartEditor',
			'Dreamweaver',
			'Eclipse',
			'EiffelStudio',
			'Emacs',
			'FlexBuilder',
			'IPythonNotebook',
			'JetBrains',
			'Matlab',
			'NetBeans',
			'NotepadPP',
			'SlickEdit',
			'SublimeText',
			'TextMate',
			'Xcode',
		];

		$scope.osTemplates = [];
		$scope.selectedOSs = [];
		$scope.langTemplates = [];
		$scope.selectedLangs = [];
		$scope.editorTemplates = [];
		$scope.selectedEditors = [];
		$scope.otherTemplates = [];
		$scope.selectedOthers = [];

		 // get the github/gitignore templates
		 var apiBase = "https://api.github.com";
		 var templatesBase = apiBase + "/gitignore/templates";

		 // for some reason this doesn't include the Global folder, OS and editor ignores
		 $http({
		 	method: 'GET',
		 	url: templatesBase,
		 	cache: true,
		 	headers: {
		 		'Authorization': 'token bc01100a6338a677b72469843dcdfe756246b005'
		 	}
		 }).success(function(data, status, headers, config) {
		 	if (status != 200) {
		 		apiError(data, status, headers, config);
		 		return;
		 	}

		 	var templates = data;

		 	for (var i = 0; i < templates.length; i++) {
		 		if ($.inArray(templates[i], langs) !== -1) {
		 			$scope.langTemplates.push({
		 				name: templates[i],
		 				apiUrl: templatesBase+"/"+templates[i],
		 				gitignoreApi: true,
		 			});
		 		} else {
		 			$scope.otherTemplates.push({
		 				name: templates[i],
		 				apiUrl: templatesBase+"/"+templates[i],
		 				gitignoreApi: true,
		 			});
		 		}
		 	};
		 });

		 // do the Global folder directly
		 $http({
		 	method: 'GET',
		 	url: apiBase+"/repos/github/gitignore/contents/Global",
		 	cache: true,
		 	headers: {
		 		'Authorization': 'token bc01100a6338a677b72469843dcdfe756246b005'
		 	}
		 }).success(function(data, status, headers, config) {
		 	if (status != 200) {
		 		apiError(data, status, headers, config);
		 		return;
		 	}

		 	var contents = data;

		 	for (var i = 0; i < contents.length; i++) {
		 		if (contents[i].type != "file" || contents[i].name.split('.').pop() != "gitignore")
		 			continue;

		 		var name = contents[i].name.split('.')[0];
		 		if ($.inArray(name, oss) !== -1) {
		 			$scope.osTemplates.push({
		 				name: name,
		 				apiUrl: contents[i].url,
		 				gitignoreApi: false,
		 				checked: false,
		 			});
		 		} else if ($.inArray(name, editors) !== -1) {
		 			$scope.editorTemplates.push({
		 				name: name,
		 				apiUrl: contents[i].url,
		 				gitignoreApi: false,
		 			});
		 		} else {
		 			$scope.otherTemplates.push({
		 				name: name,
		 				apiUrl: contents[i].url,
		 				gitignoreApi: false,
		 			});
		 		}
		 	};
		 });

		 $scope.generateGitignore = function() {
		 	var output = "";

		 	var allTemplates = [];
		 	allTemplates = allTemplates.concat($scope.selectedOSs).concat($scope.selectedLangs).concat($scope.selectedEditors).concat($scope.selectedOthers);

		 	angular.forEach(allTemplates, function(template) {
		 		$http({
				 	method: 'GET',
				 	url: template.apiUrl,
				 	cache: true,
				 	headers: {
				 		'Authorization': 'token bc01100a6338a677b72469843dcdfe756246b005'
				 	}
				 }).success(function(data, status, headers, config) {
				 	if (status != 200) {
				 		apiError(data, status, headers, config);
				 		return;
				 	}

				 	output += '### '+template.name+'\n';

				 	if (template.gitignoreApi) {
				 		output += data.source;
				 	} else {
				 		output += atob(data.content);
				 	}

				 	output += '\n\n';

				 	$scope.gitignoreOutput = $sce.trustAsHtml(output);

				 });
		 	});

		 }

		$scope.osChange = function(template) {
			template.checked = !template.checked;
			$scope.selectedOSs = [];
			angular.forEach($scope.osTemplates, function(value) {
				if (value.checked) {
					$scope.selectedOSs.push(value);
				}
			});
		}

		function apiError(data, status, headers, config) {
			console.log("API Error");
		 	console.log(data);
		 	console.log(status);
		 	console.log(headers);
		}


}]);
