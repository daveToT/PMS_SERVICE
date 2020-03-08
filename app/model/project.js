'use strict';

const User = require('./user');

module.exports = app => {
  const { STRING, UUID, TEXT, UUIDV4 } = app.Sequelize;

  const Project = app.model.define('projects', {
    id: { type: UUID, primaryKey: true, defaultValue: UUIDV4 },
    name: {
      type: STRING(20),
      unique: true,
    },
    desc: TEXT, // 描述
    tags: TEXT, // 标签id
  });

  Project.belongsTo(User(app));
  Project.sync();

  return Project;
};
