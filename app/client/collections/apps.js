Apps = new Mongo.Collection('apps', {transform: function(app) {

  app.latestVersion = function() {
    return _.sortBy(this.versions, function(entry) {
      return -entry.createdAt;
    })[0];
  };

  app.onGithub = function() {
    return this.codeLink && this.codeLink.indexOf('github.com') > -1;
  };

  app.getLocation = function() {
    return this.spkLink;
  };

  if (Meteor.isClient)
    app.install = function() {
      var _this = this;
      App.getSandstormHost(function(host) {
        Meteor.call('user/installApp', _this._id, host, function(err) {
          if (err) console.log(err);
          else {
            var packageId = _this.latestVersion() && _this.latestVersion().packageId;
            window.open(host + 'install/' + packageId + '?url=' + Meteor.absoluteUrl() + 'package/' + packageId, "_blank");
            var installedLocally = amplify.store('sandstormInstalledApps');
            if (!installedLocally) amplify.store('sandstormInstalledApps', [_this._id]);
            else if (installedLocally.indexOf(_this._id) === -1) {
              installedLocally.push(_this._id);
              amplify.store('sandstormInstalledApps', installedLocally);
              App.historyDep.changed();
            }
          }
        });
      });
    };

  app.installed = function() {

    if (typeof window !== 'undefined') {
      var appIds = window.amplify.store('sandstormInstalledApps') || [];
      if (appIds.indexOf(this._id) > -1) return true;
    }
    var userId = this.userId || Meteor.userId(),
        user = Meteor.users.findOne(userId);
    if (user && this._id in user.installedApps) return true;

    return false;

  };

  app.googlePlusLink = function() {
    return (this.socialLinks && this.socialLinks.google && this.socialLinks.google.id) ?
             'https://plus.google.com/' + this.socialLinks.google.id : null;
  };
  app.facebookLink = function() {
    return (this.socialLinks && this.socialLinks.facebook && this.socialLinks.facebook.link) ?
             this.socialLinks.facebook.link : null;
  };
  app.twitterLink = function() {
    return (this.socialLinks && this.socialLinks.twitter && this.socialLinks.twitter.screenName) ?
             'https://twitter.com/' + this.socialLinks.twitter.screenName : null;
  };
  app.githubLink = function() {
    return (this.socialLinks && this.socialLinks.github && this.socialLinks.github.username) ?
             'https://github.com/' + this.socialLinks.github.username : null;
  };

  return app;
}});

Apps.approval = {
  approved: 0,
  pending: 1,
  revisionRequested: 2,
  rejected: 3,
  draft: 4
};

// appsBaseSchema contains the keys that are required for a valid app object,
// but NOT anything which will be autoValued or receive a default value only
// when the app is added to the DB.
var VersionSchema = new SimpleSchema({
  number: {
    type: String,
    max: 20
  },
  packageId: {
    type: String,
  },
  changes: {
    type: String,
    optional: true
  }
});

var appsBaseSchema = {
  _id: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    optional: true
  },
  name: {
    type: String,
    max: 200,
    index: true
  },
  categories: {
    type: [String],
    index: true,
    defaultValue: [],
    minCount: 1
  },
  description: {
    type: String,
    max: 5000,
    defaultValue: '',
    optional: true
  },
  image: {
    type: String,
    // regEx: SimpleSchema.RegEx.Url,
    optional: true
  },
  screenshots: {
    type: [Object],
    blackbox: true,
    defaultValue: []
  },
  'screenshots.$.url': {
    type: String,
    regEx: SimpleSchema.RegEx.Url
  },
  'screenshots.$.comment': {
    type: String,
    optional: true
  },
  authorName: {
    type: String
  },
  webLink: {
    type: String,
    regEx: SimpleSchema.RegEx.Url,
    optional: true
  },
  codeLink: {
    type: String,
    regEx: SimpleSchema.RegEx.Url,
    optional: true
  },
  spkLink: {
    type: String,
    regEx: SimpleSchema.RegEx.Url,
    optional: true
  },
  license: {
    type: String,
    optional: true
  },
  versions: {
    type: [VersionSchema],
    defaultValue: [],
    minCount: 1
  },
  appId: {
    type: String,
    optional: true
  },
  socialLinks: {
    type: Object,
    blackbox: true,
    defaultValue: {}
  },
  installCount: {
    type: Number,
    min: 0,
    defaultValue: 0
  },
  installCountThisWeek: {
    type: Number,
    min: 0,
    defaultValue: 0
  },
  ratingsCount: {
    type: Number,
    min: 0,
    defaultValue: 0
  },
  ratings: {
    type: Object,
    defaultValue: {
      broken: 0,
      didntLike: 0,
      jobDone: 0,
      amazing: 0
    },
  },
  'ratings.broken': {
    type: Number,
    min: 0,
    defaultValue: 0
  },
  'ratings.didntLike': {
    type: Number,
    min: 0,
    defaultValue: 0
  },
  'ratings.jobDone': {
    type: Number,
    min: 0,
    defaultValue: 0
  },
  'ratings.amazing': {
    type: Number,
    min: 0,
    defaultValue: 0
  }

};

Schemas.AppsBase = new SimpleSchema(appsBaseSchema);

Apps.attachSchema(Schemas.AppsBase);

if (Meteor.isServer) {
  Apps.allow({
    insert: function (userId, doc) {
      return false;
    },

    update: function (userId, doc, fieldNames, modifier) {
      return false;
    },

    remove: function (userId, doc) {
      return false;
    }
  });

  Apps.deny({
    insert: function (userId, doc) {
      return true;
    },

    update: function (userId, doc, fieldNames, modifier) {
      return true;
    },

    remove: function (userId, doc) {
      return true;
    }
  });
}