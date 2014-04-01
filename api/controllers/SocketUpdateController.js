/**
 * SocketUpdateController
 *
 * @module      :: Controller
 * @description    :: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {

//
//    /**
//     * Action blueprints:
//     *    `/socketupdate/find`
//     */
//    find: function (req, res) {
//
//        // Send a JSON response
//        SocketUpdate.find(function (err, socketUpdates) {
//            if (err) return console.log(err);
//            res.json(socketUpdates);
//        })
//    },
//
//
//    /**
//     * Action blueprints:
//     *    `/socketupdate/create`
//     */
//    create: function (req, res) {
//
//        console.log('SocketUpdateController.create, req.param("contents")');
//        console.log(req.param('contents'));
//
//        SocketUpdate.create({contents:req.param('contents')}).done(function(err,socketUpdate){
//            if( err) return next(err);
//            console.log( 'SocketUpdateController.create, new socketUpdate created.');
//            console.log(socketUpdate);
//        });
//    },
//

    /**
     * Action blueprints:
     *    `/socketupdate/update`
     */
    update: function (req, res) {

        // Not implemented.
    },


    /**
     * Action blueprints:
     *    `/socketupdate/destroy`
     */
    destroy: function (req, res) {

        // Not implemented.
    },


    /**
     * Overrides for the settings in `config/controllers.js`
     * (specific to SocketUpdateController)
     */
    _config: {}


};
