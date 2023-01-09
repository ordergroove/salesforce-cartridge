# Ordergroove Sales Force Commerce Cloud Cartridge #

This cartridge is developed in accordance with SFCC and OG development best practices. Full Sales Force App Exchange listing is <a href="https://appexchange.salesforce.com/listingDetail?listingId=a0N3A00000G0yJ1UAJ" target="_blank">available here</a>. 

### Objectives ###

* OG SFCC cartridge is compatible with all 3 versions of SFCC (Pipelines, Controllers, SFRA)
* Brings the time to integrate with OrderGroove and SFCC down from months to days


### Getting Started ###

1. Clone this repository.
2. Install npm dependancies `npm install`
3. Open package.json file and modify `paths.base` property to point to the local directory containing the Storefront Reference Architecture project
4. Run `npm run compile:js` to create client-side assets
5. Upload the `cartridges` folder to the WebDav location for cartridges for your Sandbox through any WebDAV client.

### Testing ###
## Running unit tests

You can run `npm test` to execute all unit tests in the project. Run `npm run cover` to get coverage information. Coverage will be available in `coverage` folder under root directory.

* UNIT test code coverage:
1. Open a terminal and navigate to the root directory of the ordergroove repository.
2. Enter the command: `npm run cover`.
3. Examine the report that is generated. For example: `Writing coverage reports at [/Users/yourusername/SCC/sfra/coverage]`
3. Navigate to this directory on your local machine, open up the index.html file. This file contains a detailed report.

## Running integration tests
Integration tests are located in the `storefront-reference-architecture/test/integration` directory.

To run integration tests you can use the following command:

```
npm run test:integration
```

**Note:** Please note that short form of this command will try to locate URL of your sandbox by reading `dw.json` file in the root directory of your project. If you don't have `dw.json` file, integration tests will fail.
sample `dw.json` file (this file needs to be in the root of your project)
{
    "hostname": "devxx-sitegenesis-dw.demandware.net"
}

You can also supply URL of the sandbox on the command line:

```
npm run test:integration -- --baseUrl devxx-sitegenesis-dw.demandware.net
```

### Questions?  Comments? ###
Please contact: salesforce@ordergroove.com