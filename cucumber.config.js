module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: ['features/step_definitions/orquestador_steps.ts'],
    format: [
      'pretty',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    paths: ['features/**/*.feature'],
    publishQuiet: true
  }
};

