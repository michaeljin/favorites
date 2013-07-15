// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){

  var geocode = function (address, fn) {
      var geocoder = new google.maps.Geocoder();
      var geocode_lat;
      var geocode_lng;
      geocoder.geocode({'address': address}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
              geocode_lat = results[0].geometry.location.lat();
              geocode_lng = results[0].geometry.location.lng();

              fn(geocode_lat, geocode_lng);
          }
      });
  };

  // Favorite Model
  // ----------

  var Favorite = Backbone.Model.extend({

    // Default attributes for the favorite.
    defaults: function() {
      return {
        nickname: "empty favorite...",
        address: "",
        lat: 37.22,
        lng: -122.22,
      };
    },

    initialize: function() {
        if (!this.get("nickname")) {
            this.set({"nickname": this.defaults().nickname});
      }
    }
  });

  // Favorite Collection
  // ---------------

  var FavoriteList = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Favorite,

    url: '/api/favorite',

    // Parse out the array from flask output
    parse: function(response) {
        if (_.isObject(response.objects)) {
            return response.objects;
        } else {
            return response;
        }
    }
  });

  // Create our global collection of **Favorites**.
  var Favorites = new FavoriteList;

  // Favorite Item View
  // --------------

  // The DOM element for a favorite item...
  var FavoriteView = Backbone.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      "click"           : "loadMap",
      "click a.edit_button" : "edit",
      "click a.destroy" : "clear",
      "keypress .edit"  : "updateOnEnter",
      "blur .edit"      : "close",
    },

    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'destroy', this.remove);
      _.bindAll(this, 'loadMap');
    },

    // Re-render the titles of the favorite item.
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.input = this.$('.edit');
      return this;
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function(e) {
      e.stopImmediatePropagation();
      this.$el.addClass("editing");
      this.input.focus();
      this.input.val(this.model.get('address'));
    },

    // Close the `"editing"` mode, saving changes to the favorite.
    close: function() {
      var value = this.input.val();
      if (!value) {
        this.clear();
      } else {
        var model = this.model;
        geocode(value, function(lat, lng) {
            model.save({'address': value, 'lat':lat, 'lng': lng});
        });
        this.model.save({'address': value});
        this.$el.removeClass("editing");
      }
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) {
          this.close();
      }
    },

    createOnEnter: function(e) {
        this.close();
    },

    // Remove the item, destroy the model.
    clear: function(e) {
      e.stopImmediatePropagation();
      this.model.destroy();
    },


    loadMap: function(e) {
        var lat = this.model.get('lat');
        var lng = this.model.get('lng');
        var nickname = this.model.get('nickname');
        $.colorbox({
            html: '<div id="map_popup" style="width:600px; height:450px;"></div>',
        scrolling:false,
        width:"600px",
        height:"470px",
        overlayClose:true,
        onLoad: function () {
            $('#cboxClose').remove();
        },
        onComplete: function() {
            var latlng = new google.maps.LatLng(lat, lng);
            var options = {
                zoom: 14,
                center: latlng,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
            };
            var map = new google.maps.Map($('#map_popup')[0], options);
            
            var marker = new google.maps.Marker({
                position: latlng,
                title: nickname,
            });
            marker.setMap(map);
        }, });
    }
  });

  // The Application
  // ---------------

  // Our overall **AppView** is the top-level piece of UI.
  var AppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#favoriteapp"),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "keypress #new-favorite":  "createOnEnter",
      "keypress #new-favorite-address": "createOnEnterAddress",
    },

    // At initialization we bind to the relevant events on the `Favorites`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting favorites.
    initialize: function() {

      this.input = this.$("#new-favorite");
      this.address_input = this.$("#new-favorite-address");
      this.address_input.hide();
      this.allCheckbox = this.$("#toggle-all")[0];

      this.listenTo(Favorites, 'add', this.addOne);
      this.listenTo(Favorites, 'reset', this.addAll);
      this.listenTo(Favorites, 'all', this.render);

      this.footer = this.$('footer');
      this.main = $('#main');

      Favorites.fetch();
    },

    render: function() {
      if (Favorites.length) {
        this.main.show();
        this.footer.show();
      } else {
        this.main.hide();
        this.footer.hide();
      }
    },

    // Add a single favorite item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(favorite) {
      var view = new FavoriteView({model: favorite});
      this.$("#favorite-list").append(view.render().el);
    },

    // Add all items in the **Favorites** collection at once.
    addAll: function() {
      Favorites.each(this.addOne, this);
    },

    // If you hit return in the main input field, create new **Favorite** model
    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;

      var nickname = this.input.val();

      this.new_nickname = nickname;
      this.input.val('');
      this.input.hide();
      this.address_input.show();
      this.address_input.focus();
    },

    createOnEnterAddress: function(e) {
      if (e.keyCode != 13) return;
      if (!this.address_input.val()) return;

      var address = this.address_input.val();
      var nickname = this.new_nickname;
      this.address_input.val('');
      this.address_input.hide();
      this.input.show();
      geocode(address, function(lat, lng) {
          Favorites.create({'nickname': nickname, 'address': address, 'lat':lat, 'lng':lng});
      });
    },
  });

  // Finally, we kick things off by creating the **App**.
  var App = new AppView;

});
