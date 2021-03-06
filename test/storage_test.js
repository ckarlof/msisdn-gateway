/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
var expect = require("chai").expect;
var getStorage = require("../msisdn-gateway/storage");
var conf = require("../msisdn-gateway").conf;
var hmac = require("../msisdn-gateway/hmac");

var msisdn = "0123456489";
var msisdnMac = hmac(msisdn, conf.get("msisdnMacSecret"));
var code = "123456";

/* var sessionToken = "164bafe9a57c3c175110c4947dcec5d16006a07da56b15530a" +
  "5f2c3087c09c42"; */
var tokenId = "8848164fde6943377ed301bfa4f2e3792f737e5f535998d4ddcc218" +
  "3c5be4523";
var authKey = "37387f4e03e5767ba8266f004003423202778b55041ea70c0d00256" +
  "e78a3bad8";

describe("Storage", function() {
  function testStorage(name, createStorage) {
    var storage;

    describe(name, function() {
      beforeEach(function() {
        storage = createStorage();
      });
  
      afterEach(function(done) {
        storage.drop(function(err) {
          // Remove the storage reference so tests blow up in an explicit way.
          storage = undefined;
          done(err);
        });
      });

      describe("#setCode", function() {
        it("should store the code.", function(done) {
          storage.setCode(msisdnMac, code,
            function(err) {
              if (err)  {
                throw err;
              }
              storage.verifyCode(msisdnMac, code, function(err, value){
                expect(value).to.equal(true);
                done();
              });
            });
        });
      });

      describe("#verifyCode", function() {
        it("should return false on invalid code.", function(done) {
          storage.setCode(msisdnMac, code,
            function(err) {
              if (err)  {
                throw err;
              }
              storage.verifyCode(msisdnMac, "wrong-code", function(err, value){
                expect(value).to.equal(false);
                done();
              });
            });
        });

        it("should return null on inexisting code.", function(done) {
          storage.setCode(msisdnMac, code,
            function(err) {
              if (err)  {
                throw err;
              }
              storage.verifyCode("wrong-mac", code, function(err, value){
                expect(value).to.equal(null);
                done();
              });
            });
        });
      });

      describe("#setSession", function() {
        it("should store the session.", function(done) {
          storage.setSession(tokenId, authKey,
            function(err) {
              if (err)  {
                throw err;
              }
              storage.getSession(tokenId, function(err, value){
                expect(value).to.eql({
                  key: authKey,
                  algorithm: "sha256"
                });
                done();
              });
            });
        });
      });

      describe("#getSession", function() {
        it("should return null on invalid tokenId.", function(done) {
          storage.setSession(tokenId, authKey,
            function(err) {
              if (err)  {
                throw err;
              }
              storage.getSession("wrong-tokenId", function(err, value){
                  expect(value).to.equal(null);
                  done();
                });
            });
        });
      });

      describe("#cleanSession", function() {
        it("should remove everything related to the session", function(done) {
          storage.setSession(tokenId, authKey,
            function(err) {
              if (err)  {
                throw err;
              }
              storage.cleanSession(tokenId, function(err) {
                if (err)  {
                  throw err;
                }
                storage.getSession(tokenId, function(err, value){
                  if (err)  {
                    throw err;
                  }
                  expect(value).to.equal(null);
                  done();
                });
              });
            });
        });
      });

      describe("#ping", function() {
        it("should return true if we are connected", function(done) {
          storage.ping(function(connected) {
            expect(connected).to.eql(true);
            done();
          });
        });
      });
    });
  }

  // Test all the storages implementation.
  testStorage("Default", function createDefaultStorage(options) {
    return getStorage({}, options);
  });

  testStorage("Redis", function createRedisStorage(options) {
    return getStorage({engine: "redis", settings: {"db": 5}}, options);
  });
});
