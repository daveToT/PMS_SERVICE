'use strict';

const Service = require('egg').Service;

class IssueService extends Service {
  async getAll(params) {
    const { ctx } = this;
    params.include = [{
      model: ctx.model.Iteration,
    }];
    const issues = await ctx.model.Issue.findAndCountAll(params);
    const { count, rows } = issues;

    for (const row of rows) {
      if (row.assignee) {
        const user = await ctx.model.User.findByPk(row.assignee);

        row.assignee = {
          id: user.id,
          name: user.name,
        };
      }

      if (row.tags) {
        const tags = await Promise.all(row.tags.split(',').map(id => {
          return ctx.model.Tag.findByPk(+id);
        }));
        row.tags = tags;
      } else {
        row.tags = [];
      }
    }

    return {
      count,
      rows,
    };
  }

  async getOne(id) {
    const { ctx } = this;
    const issue = await ctx.model.Issue.findByPk(id, {
      include: [{
        model: ctx.model.Iteration,
      }],
    });

    return issue;
  }

  async create(params) {
    const { ctx } = this;
    const searchParams = {
      where: {
        iterationId: null,
      },
    };
    if (params.iterationId) {
      searchParams.where = {
        iterationId: params.iterationId,
      };
    }
    const sort = await ctx.model.Issue.max('sort', searchParams);

    if (isNaN(sort)) {
      params.sort = 1;
    } else {
      params.sort = sort + 1;
    }

    const issue = await ctx.model.Issue.create(params);
    await this.service.activity.create(
      ctx.params.projectId,
      'CREATE',
      issue.id,
      issue.name,
      'issue'
    );

    return issue;
  }

  async destroy(id) {
    const { ctx } = this;
    const a = await ctx.model.Issue.findByPk(id);
    const issue = await ctx.model.Issue.destroy({ where: { id } });
    await this.service.activity.create(
      ctx.params.projectId,
      'DELETE',
      a.id,
      a.name,
      'issue'
    );

    return issue;
  }

  async update(id, params) {
    const { ctx } = this;
    const issue = await ctx.model.Issue.update(params, { where: { id } });
    const a = await ctx.model.Issue.findByPk(id);
    await this.service.activity.create(
      ctx.params.projectId,
      'UPDATE',
      a.id,
      a.name,
      'issue'
    );

    return issue;
  }
}

module.exports = IssueService;
