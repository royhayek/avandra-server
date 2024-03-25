// Utility function to generate population options based on model schema
exports.generatePopulationOptions = (model) => {
  const paths = model.schema.paths;
  let populationOptions = [];

  Object.keys(paths).forEach((path) => {
    // Check if the path ends with 'Id' and is an ObjectId type
    if (paths[path].instance === "ObjectId") {
      const refModelName = path.replace(/Id$/, "");
      const capitalizedModelName =
        refModelName.charAt(0).toUpperCase() + refModelName.slice(1);
      populationOptions.push({ path: path, model: capitalizedModelName });
    }
  });

  return populationOptions;
};
