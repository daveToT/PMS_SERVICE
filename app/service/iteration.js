'use strict';

const Service = require('egg').Service;

class IterationService extends Service {
  async getAll(params) {
    const { ctx } = this;
    params.include = [{
      model: ctx.model.Project,
    }];
    const iterations = await ctx.model.Iteration.findAndCountAll(params);

    return iterations;
  }

  async getOne(id) {
    const { ctx } = this;
    const iteration = await ctx.model.Iteration.findByPk(id, {
      include: [{
        model: ctx.model.Project,
      }],
    });

    return iteration;
  }

  async create(params) {
    const { ctx } = this;
    const iteration = await ctx.model.Iteration.create(params);
    await this.service.activity.create(
      ctx.params.projectId,
      'CREATE',
      iteration.id,
      iteration.name,
      'iteration'
    );

    return iteration;
  }

  async destroy(id) {
    const { ctx } = this;
    const a = await ctx.model.Iteration.findByPk(id);
    const issues = await ctx.model.Issue.findAll({ where: { iterationId: id } });
    let sort = await ctx.model.Issue.max('sort', {
      where: { iterationId: null },
    });
    if (isNaN(sort)) {
      sort = 0;
    }
    const iteration = await ctx.model.Iteration.destroy({ where: { id } });
    for (let i = 0, len = issues.length; i < len; i++) {
      await ctx.model.Issue.update({ iterationId: null, sort: sort + i + 1 }, { where: { id: issues[i].id } });
    }
    await this.service.activity.create(
      ctx.params.projectId,
      'DELETE',
      a.id,
      a.name,
      'iteration'
    );

    return iteration;
  }

  async update(id, params) {
    const { ctx } = this;
    const iteration = await ctx.model.Iteration.update(params, { where: { id } });
    const a = await ctx.model.Iteration.findByPk(id);
    await this.service.activity.create(
      ctx.params.projectId,
      'UPDATE',
      a.id,
      a.name,
      'iteration'
    );

    return iteration;
  }
}

module.exports = IterationService;
