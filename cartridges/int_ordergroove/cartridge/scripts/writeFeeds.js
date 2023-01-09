'use strict';

/**
 * OrderGroove Write Feed
 * Used to send a product feed to the OrderGroove SFTP location.
 */

/* API Includes */
var Logger = require('dw/system/Logger');
var File = require('dw/io/File');
var Site = require('dw/system/Site');
var FileWriter = require('dw/io/FileWriter');
var XMLIndentingStreamWriter = require('dw/io/XMLIndentingStreamWriter');
var Status = require('dw/system/Status');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var ProductMgr = require('dw/catalog/ProductMgr');
var URLUtils = require('dw/web/URLUtils');

/**
 * Service function to upload file to the SFTP location
 * @param {string} filePath - the local file path where the file will be placed
 * @param {string} remoteName - the remote name of the file to be uploaded
 * @returns {Object} The result of the service call
 */
function uploadFeed(filePath, remoteName) {
    var localFile = new File(filePath);
    var service = LocalServiceRegistry.createService('OrderGroove.UploadFeed', {
        createRequest: function (svc) {
            svc.setAutoDisconnect(true);
            var remotePath = '/incoming/' + Site.getCurrent().getCustomPreferenceValue('OrderGrooveMerchantID') + '.' + remoteName + '.xml';
            svc.setOperation('putBinary', remotePath, localFile);
        },
        parseResponse: function (svc, response) {
            return response;
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
    var result = service.call();
    return result;
}

/**
 * Job process function
 * @returns {Object} The resulting status
 */
function writeProducts() {
    var log = Logger.getLogger('ordergroove', 'OG');
    try {
        var priceBookID = Site.getCurrent().getCustomPreferenceValue('OrderGroovePriceBookID');
        var viewType = Site.getCurrent().getCustomPreferenceValue('OrderGrooveImageViewType');
        var dir = new File(File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + 'catalog-feeds');
        if (!dir.isDirectory()) {
            dir.mkdir();
        }
        var output = Site.getCurrent().getCustomPreferenceValue('OrderGrooveMerchantID') + '.Products.xml';
        var file = new File(dir, output);
        var products = ProductMgr.queryAllSiteProductsSorted();
        var writer = new FileWriter(file);
        var xisw = new XMLIndentingStreamWriter(writer);
        xisw.setIndent('\t');
        xisw.writeStartElement('products');
        while (products.hasNext()) {
            var product = products.next();
            if (product !== null && product.isOnline() && !product.isMaster()) {
                xisw.writeStartElement('product');
                xisw.writeStartElement('name');
                xisw.writeCData(product.getName());
                xisw.writeEndElement();
                xisw.writeStartElement('product_id');
                xisw.writeCharacters(product.getID());
                xisw.writeEndElement();
                xisw.writeStartElement('sku');
                xisw.writeCharacters(product.getID());
                xisw.writeEndElement();
                var salePrice = product.getPriceModel().getPriceBookPrice(priceBookID).getValue().toFixed(2);
                xisw.writeStartElement('price');
                xisw.writeCharacters(salePrice);
                xisw.writeEndElement();
                var productURL = URLUtils.https('Product-Show', 'pid', product.getID()).toString();
                xisw.writeStartElement('details_url');
                xisw.writeCharacters(productURL);
                xisw.writeEndElement();
                var imageURL = viewType !== null && product.getImage(viewType) !== null ? product.getImage(viewType).getHttpsURL().toString() : '';
                xisw.writeStartElement('image_url');
                xisw.writeCharacters(imageURL);
                xisw.writeEndElement();
                var inStock = product.getAvailabilityModel().isInStock() ? '1' : '0';
                xisw.writeStartElement('in_stock');
                xisw.writeCharacters(inStock);
                xisw.writeEndElement();
                xisw.writeEndElement();
            }
        }
        xisw.writeEndElement();
        xisw.flush();
        xisw.close();
        writer.flush();
        writer.close();
        var exportPath = file.getFullPath();
        var result = uploadFeed(exportPath, 'Products');
        if (result.isOk() === false) {
            return new Status(Status.ERROR, 'ERROR', result.getErrorMessage());
        }
        return new Status(Status.OK);
    } catch (e) {
        var error = e;
        log.error(error.toString());
        return new Status(Status.ERROR, 'ERROR', error.toString());
    }
}

/* Module export for the job */
module.exports = {
    writeProductFeed: writeProducts
};
