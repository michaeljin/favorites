$(function() {
    // Define the model
    var Favorite = Backbone.Model.extend({
        defaults:{
            nickname: 'My favorite',
            lat: 37.22,
            lng: -122.22,
        },

        toggle: function(){
            this.set('checked', !this.get('checked'));
        }
    });

    var FavoriteList = Backbone.Collection.extend({
        model: Favorite,

        url: '/api/favorite',

        getChecked: function() {
            return this.where({checked:true});
        }
    });

    var sampleFavorites = new FavoriteList([
            new Favorite({nickname: 'gym', lat:37.22, lng:-122.33}),
            new Favorite({nickname: 'home', lat:37.22, lng:-122.44}),
            ]);
    //var sampleFavorites = new FavoriteList;

    var FavoriteView = Backbone.View.extend({
        tagName: 'li',

        template: _.template($('#item-template').html()),

        events:{
            'dblclick .view': 'edit',
            'click a.destroy': 'clear',
        },

        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
        },



        render: function() {
            //this.$el.html('<input type="checkbox" value="1" name="' + this.model.get('nickname') +'" />' + '<span>' + this.model.get('lat') + '</span>');

            this.$el.html(this.template(this.model.toJSON()));
            this.input = this.$('.edit');
            return this;
        },

        edit: function() {
            this.$el.addClass('editing');
            this.input.focus();
        },

        clear: function() {
            this.model.destroy();
        }

    });

    var App = Backbone.View.extend({
        el: $('#main'),
        initialize: function() {
            this.listenTo(sampleFavorites, 'change', this.render);
            this.list = $('#favorites');

            sampleFavorites.each(function(favorite) {
                var view = new FavoriteView({model:favorite});
                this.list.append(view.render().el);
            }, this);
        },

        render: function() {
            return this;
        }
    });

    new App();
});
