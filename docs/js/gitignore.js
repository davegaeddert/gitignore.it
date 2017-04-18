jQuery(function($) {
	$("#tell-me-more").click(function(e) {
		e.preventDefault();
		$(this).parent().next().slideDown();
	});
});

angular.module('gitignoreApp', ['ui.ace'])
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
			'vim',
			'Xcode',
		];

		$scope.osTemplates = [];
		$scope.langTemplates = [];
		$scope.editorTemplates = [];
		$scope.otherTemplates = [];

		$scope.stepsCompleted = 0;

		 // get the github/gitignore templates
		 var apiBase = "https://api.github.com";
		 var templatesBase = apiBase + "/gitignore/templates";
		 var creds = {};

		 $http.post('secret.php').success(function(data) {
		 	if (data) {
		 		creds = data;
		 		getTemplates(creds);
		 	} else {
		 		jQuery(".loading").text("FAILED");
		 	}
		 });

		 function getTemplates() {
			 // for some reason this doesn't include the Global folder, OS and editor ignores
			 $http({
			 	method: 'GET',
			 	url: templatesBase,
			 	cache: true,
			 	params: creds,
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
			 				content: false,
			 			});
			 		} else {
			 			$scope.otherTemplates.push({
			 				name: templates[i],
			 				apiUrl: templatesBase+"/"+templates[i],
			 				gitignoreApi: true,
			 				content: false,
			 			});
			 		}
			 	};
			 });

			 // do the Global folder directly
			 $http({
			 	method: 'GET',
			 	url: apiBase+"/repos/github/gitignore/contents/Global",
			 	cache: true,
			 	params: creds,
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
			 				content: false,
			 			});
			 		} else if ($.inArray(name, editors) !== -1) {
			 			$scope.editorTemplates.push({
			 				name: name,
			 				apiUrl: contents[i].url,
			 				gitignoreApi: false,
			 				content: false,
			 			});
			 		} else {
			 			$scope.otherTemplates.push({
			 				name: name,
			 				apiUrl: contents[i].url,
			 				gitignoreApi: false,
			 				content: false,
			 			});
			 		}
			 	};
			 });
		}

		 $scope.generateGitignore = function() {

		 	var allTemplates = [];
		 	allTemplates = allTemplates
		 		.concat($scope.osTemplates)
		 		.concat($scope.langTemplates)
		 		.concat($scope.editorTemplates)
		 		.concat($scope.otherTemplates);
		 	allTemplates = allTemplates.filter(filterSelected);

		 	angular.forEach(allTemplates, function(template) {
		 		// skip http if template.content, should be caching anyway so fine for now

		 		$http({
				 	method: 'GET',
				 	url: template.apiUrl,
				 	cache: true,
				 	params: creds,
				 }).success(function(data, status, headers, config) {
				 	if (status != 200) {
				 		apiError(data, status, headers, config);
				 		return;
				 	}

				 	var content = '### '+template.name+' ###\n';
				 	if (template.gitignoreApi) {
				 		content += data.source;
				 	} else {
				 		content += atob(data.content);
				 	}
				 	content += '\n\n';
				 	template.content = content;

				 	var ready = true;
				 	angular.forEach(allTemplates, function(t) {
				 		ready = ready && t.content !== false;
				 	});
				 	if (ready) {
				 		var output = "";
				 		angular.forEach(allTemplates, function(t) {
					 		output += t.content;
					 	});
				 		$scope.gitignoreOutput = output;
				 	}

				 });
		 	});

		 }

		function filterSelected(item) {
			return item.selected === true;
		}

		$scope.didStep = function(step) {
			$scope.stepsCompleted = $scope.stepsCompleted == step - 1 ? step : $scope.stepsCompleted;
			$scope.generateGitignore();
		}

		$scope.loading = function() {
			return $scope.osTemplates.length !=0 &&
			$scope.langTemplates.length !=0 &&
			$scope.editorTemplates.length !=0 &&
			$scope.otherTemplates.length !=0;
		}

		$scope.download = function() {
			try {
				// var isSupported = !!new Blob;
				var blob = new Blob([$scope.gitignoreOutput], {type: "text/plain;charset=utf-8"});
				saveAs(blob, "rename_to_.gitignore.txt");
			} catch (e) {
				console.log(e);
				alert("Why aren't you using a modern browser?!")
			}
		}

		function apiError(data, status, headers, config) {
			console.log("API Error");
		 	console.log(data);
		 	console.log(status);
		 	console.log(headers);
		}


}]);
