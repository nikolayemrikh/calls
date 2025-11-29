// .js file because VSCode extension doesn't support .ts
// eslint-disable-next-line no-undef
module.exports = {
  projects: {
    'towers': {
      schema: 'http://localhost:54321/graphql/v1',
      documents: ['./src/**/*.{ts,tsx}'],
    },
  },
};

