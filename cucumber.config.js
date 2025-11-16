module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: ['features/step_definitions/orquestador_steps.ts'],
    format: [
      'progress',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    paths: ['features/**/*.feature'],
    timeout: 30000 // 30 segundos máximo por step (algunas pruebas necesitan más tiempo)
  }
};
