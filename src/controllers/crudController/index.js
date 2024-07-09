const crudMethods = require("./crudMethods");
// const mongoose = require("mongoose");

exports.crudController = (Collection) => {
  // const Model = require(`../models/${modelName}`);
  let methods = {};

  methods.create = async (req, res) => {
    crudMethods.create(Collection, req, res);
  };

  methods.createWithImage = async (req, res) => {
    crudMethods.createWithImage(Collection, req, res);
  };

  methods.read = async (req, res) => {
    crudMethods.read(Collection, req, res);
  };

  methods.update = async (req, res) => {
    crudMethods.update(Collection, req, res);
  };

  methods.updateWithImage = async (req, res) => {
    crudMethods.updateWithImage(Collection, req, res);
  };

  methods.delete = async (req, res) => {
    crudMethods.delete(Collection, req, res);
  };

  methods.list = async (req, res) => {
    crudMethods.list(Collection, req, res);
  };

  methods.search = async (req, res) => {
    crudMethods.search(Collection, req, res);
  };

  return methods;
};
