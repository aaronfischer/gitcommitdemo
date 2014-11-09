/***************************************
	Register and subscribe to new collection
***************************************/
Commits = new Meteor.Collection('commits');
commits = Commits;
Meteor.publish('commits', function() {
	return commits.find();
});



/***************************************
	Accounts/Login
***************************************/
ServiceConfiguration.configurations.remove({
	service: "github"
});
ServiceConfiguration.configurations.insert({
	service: "github",
	//local
	clientId: "da009d6395dc0eabf363",
	//local
	secret: "6af7c6b572c49bde3afbaf7758da238a7568a39a"
});

Accounts.onCreateUser(function (options, user){
	var accessToken = user.services.github.accessToken,
		result,
		profile;

	result = Meteor.http.get("https://api.github.com/user", {
		params: {
			access_token: accessToken
		},
		headers: {
			"User-Agent": "Meteor/1.0"
		}
	});

	if (result.error){
		throw result.error;
	}

	profile = _.pick(result.data,
		"login",
		"name",
		"avatar_url",
		"url",
		"company",
		"blog",
		"location",
		"email",
		"bio",
		"html_url");
	user.profile = profile;

	return user;
});



/***************************************
	Meteor Methods / Permissions / Allow&Deny
***************************************/
// we use a method for the addCommit because its secure but doesnt need a bunch of checks
// we have frontend code to run the checks, check length/etc
Meteor.methods({
	addCommit: function(commitId,user,message){
		var commit = Commits.findOne(commitId);
		Commits.insert({user:user,date:new Date(),message:message});
	},
	updateVote: function(id,user){
		Commits.update(id, {$inc: {votes: 1}});
	}
});
ownsDocument = function(userId, doc) {
	if (doc.user === userId) {  //if the creator is trying to remove it
		return true;
	}
	return false;
}
// allow and deny are only on the server
// we only want to check if the user owns the document, thats about it
Commits.allow({
	update: ownsDocument,
	remove: ownsDocument
});
