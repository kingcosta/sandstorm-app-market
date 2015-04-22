// Genres is designed as an interface to the Apps collection, which incorporates
// Categories, but also extends them.  It has the following methods:
//
// findIn(name, selector, options) - this will return a cursor on the Apps
//   collection.  If "name" is the name of a Category, it will simply apply
//   the selector and options to the subset of apps within that category.  If
//   "name" is the name of an extraGenre (defined below), it will apply the
//   query to the docs within Apps matching that search specification.
//
// findOneIn(name, selector, options) - as above, but returns a single document
//   from the Apps collection, or undefined.
//
// getAll - returns the names of all Categories and extraGenres.
//
// ******************
//
// extraGenres - this is simply an array of objects, each of which has a name
//   and a selector/options pair to apply to a query on the Apps collection.
//   selector and options can be an object or a function returning an object.

var extraGenres = [

  {
    name: 'All',
    selector: {},
    options: {},
    priority: 1,
    showSummary: false
  },

  {
    name: 'Popular',
    selector: {},
    options: {
      sort: {installCount: -1}
    },
    priority: 0,
    showSummary: true
  },

  {
    name: 'New',
    selector: {},
    options: {
      sort: {createdAt: -1}
    },
    priority: 1,
    showSummary: false
  },

  {
    name: 'New & Updated',
    selector: {},
    options: {
      sort: {lastUpdated: -1}
    },
    priority: 0,
    showSummary: true
  },

  {
    name: 'This Week',
    selector: {},
    options: {
      sort: {installCountThisWeek: -1}
    },
    priority: 0,
    showSummary: true
  },

  {
    name: 'Installed',
    selector: function(userId) {
      var user = Meteor.users.findOne(
        userId ||
        this.userId ||
        (Meteor.userId && Meteor.userId())
      );
      return user && {_id: {$in: user.installedApps}};
    },
    options: {},
    priority: 2,
    showSummary: false
  }

];

function invokeGenreFunctions(extraGenre, origSelector, origOptions, context) {

  var eGenSelector = extraGenre.selector,
      eGenOptions = extraGenre.options;
  if (_.isFunction(eGenSelector)) eGenSelector = eGenSelector.apply(context);
  if (_.isFunction(eGenOptions)) eGenOptions = eGenOptions.apply(context);

  return {
    selector: _.extend(origSelector, eGenSelector),
    options: _.extend(origOptions, eGenOptions)
  };

}

Genres = {

  findIn: function(name, selector, options, context) {

    selector = selector || {};
    options = options || {};

    var category = Categories.findOne({name: name}),
        extraGenre = _.findWhere(extraGenres, {name: name});

    if (category) {
      _.extend(selector, {category: category.name});
      return Apps.find(selector, options);
    }
    else if (extraGenre) {
      var params = invokeGenreFunctions(extraGenre, selector, options, context);
      return Apps.find(params.selector, params.options);
    } else {
      return Apps.find(null);
    }

  },

  findOneIn: function(name, selector, options, context) {

    selector = selector || {};
    options = options || {};

    var category = Categories.findOne({name: name}),
        extraGenre = _.findWhere(extraGenres, {name: name});

    if (category) {
      _.extend(selector, {category: category.name});
      return Apps.findOne(selector, options);
    }
    else if (extraGenre) {
      var params = invokeGenreFunctions(extraGenre, selector, options, context);
      return Apps.findOne(params.selector, params.options);
    }

  },

  getAll: function(options) {

    options = options || {};

    var genres  = extraGenres.concat(Categories.find().fetch());
    if (options.where) genres = _.where(genres, options.where);
    if (options.filter) genres = _.filter(genres, options.filter);

    if (options.iteratee) return _.sortBy(genres, options.iteratee);
    else return genres;

  },

  getOne: function(name) {

    return Categories.findOne({name: name}) ||
           _.findWhere(extraGenres, {name: name});

  }

};
