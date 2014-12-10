/***************************************
	Register and subscribe to new collection
***************************************/
Commits = new Meteor.Collection('commits');
commits = Commits;
Meteor.subscribe('commits');



/***************************************
	Set Session Initial Values
***************************************/
Session.setDefault('showProjectDialog', true);
Session.setDefault('editing_commit',null);
Session.setDefault('clearProject', false);
Session.setDefault('overlayDisplay',false);
Session.setDefault('loggedIn',false);



Meteor.startup(function() {
	Session.set('allowVote', JSON.parse(localStorage.getItem("allowVote")));
	if(JSON.parse(localStorage.getItem("allowVote")) == false){
		allowVoteInterval();
	}
	if(JSON.parse(localStorage.getItem("modalInfo")) == null || JSON.parse(localStorage.getItem("modalInfo")) == true){
		localStorage.setItem('modalInfo',true);
		Session.set('modalInfo',JSON.parse(localStorage.getItem("modalInfo")));
	} else{
		Session.set('modalInfo',JSON.parse(localStorage.getItem("modalInfo")));
	}
});

Router.map(function() {
	this.route('home', {path: '/'});
});

Deps.autorun(function(){
	if(Meteor.userId()){
		Session.set('loggedIn',true);
	}
});



/***************************************
	Return Variables
***************************************/
Template.home.commitList = function(){
	return Commits.find({},{sort:[['votes','desc']]});
}
// checks and sets the commitRow message an edit button if the user owns the post
Template.commitRow.edit = function(e,tmpl){
	var messageUser = this.user,
		user = Meteor.users.findOne(Meteor.userId);
	if(user._id == messageUser){
		return Session.get('loggedIn');
	}
}



/***************************************
	Events
***************************************/
Template.user_loggedout.events({
	'click #login': function(e,tmpl){
		Meteor.loginWithGithub({
			requestPermissions: ['user', 'public_repo'],
			loginStyle: 'redirect'
		}, function (err) {
			if (err){
				Session.set('errorMessage', err.reason || 'Unknown error');
			} else{
				console.log('no error?');
			}
		});
		Session.set('loggedIn',true);
	}
});
Template.user_loggedin.events({
	'click #logout': function(e,tmpl){
		Meteor.logout(function (err){
			if(err){
				// err handling
			} else{
				// alert(err);
			}
		});
		Session.set('loggedIn',false);
	}
});
Template.commitForm.events({
	'click .save, keyup .message': function(evt,tmpl){
		// check if its a click or a return keyup
		if(evt.type == 'keyup' && evt.which === 13 || evt.type == 'click'){
			var user = Meteor.users.findOne(Meteor.userId),
				message = tmpl.find('.message').value;
			// check if message.value is empty and throw error
			if(message.length > 1){
				if(Session.get('editing_commit')){
					updateCommit(user._id,message);
				}else{
					Meteor.call("addCommit",this._id,user._id,message);
				}
				closeOverlay();
				clearValues();
			} else{
				alert('Message must contain more than 2 characters');
			}
		}
	},
	'click .cancel, keyup .overlay': function(evt,tmpl){
		if(evt.type == 'keyup' && evt.which === 27 || evt.type == 'click'){
			closeOverlay();
		}
	},
	'click .remove': function(evt,tmpl){
		removeCommit(evt,tmpl);
		closeOverlay();
	}
});
$(document).on('keyup', function(evt){
	if(evt.which === 27){
		closeOverlay();
		closeModal();
	}
});
Template.infoModal.events({
	'click .cancel': function(evt,tmpl){
		if(evt.type == 'keyup' && evt.which === 27 || evt.type == 'click'){
			localStorage.setItem("modalInfo", false);
			closeModal();
		}
	}
});
Template.home.events({
	'click .addMessage': function(evt,tmpl){
		if(Session.get('loggedIn')){
			Session.set('showProjectDialog',true);
			Session.set('overlayDisplay',true);
			setTimeout(function() { $('input#message').focus(); }, 100);
		} else{
			alert('Please log in with GitHub');
		}
	},
});
Template.commitRow.events({
	'click .edit':function(evt,tmpl){
		var message = tmpl.data,
			user = Meteor.users.findOne(Meteor.userId),
			messageUser = message.user;
		if(user){
			// only edit your own message
			if(user._id == messageUser){
				Session.set('editing_commit',tmpl.data._id);
				Session.set('showProjectDialog',true);
				Session.set('overlayDisplay',true);
				setTimeout(function() { $('input#message').focus(); }, 100);
			} else{
				alert('not authorized');
			}
		} else{
			alert('Please log in to update');
		}
	},
	'click .upVote': function(evt, tmpl){
		var id = tmpl.data._id,
			user = Meteor.users.findOne(Meteor.userId);
		if(user){
			// check if user is allowed to vote
			if(Session.equals('allowVote',true) || Session.get('allowVote') == null){
				Meteor.call("updateVote",id,user._id);
				localStorage.setItem("allowVote", false);
				Session.set("allowVote", localStorage.getItem("allowVote"));
				allowVoteInterval();
			} else{
				alert('Please wait a few minutes to vote again');
			}
		} else{
			alert('Please log in to upvote');
		}
	}
});



/***************************************
	Helpers
***************************************/
Template.commitForm.helpers({
	overlayDisplay: function(){
		return Session.equals('overlayDisplay',true) ? "open" : "closed";
	},
	commit: function(){
		return Commits.findOne({_id:Session.get('editing_commit')});
	},
	editing_commit: function(){
		return Session.get('editing_commit');
	}
});

Template.infoModal.helpers({
	modalInfo: function(){
		return Session.equals('modalInfo',true) ? "open" : "closed";
	}
});



/***************************************
	Misc Functions
***************************************/
// Clears and closes out the overlay
var closeOverlay = function(){
	Session.set('clearProject',false);
	Session.set('editing_commit',null);
	Session.set('showProjectDialog',false);
	Session.set('overlayDisplay',false);
}
var closeModal = function(){
	Session.set('modalInfo',false);
}
var addCommit = function(user,message){
	Commits.insert({user:user,date:new Date(),message:message});
}
var updateCommit = function(user,message){
	Commits.update(Session.get('editing_commit'),{$set: {user:user,date:new Date(),message:message}});
	return true;
}
var removeCommit = function(user,message){
	Commits.remove({_id:Session.get('editing_commit')});
}
var clearValues = function(){
	$('.message').val('').focus();
}
// Every 60 seconds the session variable is reset to TRUE to allow voting
var allowVoteInterval = function(){
	setTimeout(function(){
		localStorage.setItem("allowVote", true);
		Session.set('allowVote',JSON.parse(localStorage.getItem("allowVote")));
	}, 60000);
}
