import type { CodegenConfig } from '@graphql-codegen/cli'
import { addTypenameSelectionDocumentTransform } from '@graphql-codegen/client-preset'

const config: CodegenConfig = {
  ignoreNoDocuments: true,
  generates: {
    'src/__generated__/graphql/': {
      schema: 'http://localhost:54321/graphql/v1', // Using the local endpoint, update if needed
      documents: 'src/**/*.{ts,tsx}',
      preset: 'client',
      documentTransforms: [addTypenameSelectionDocumentTransform],
      plugins: [],
      config: {
        scalars: {
          UUID: 'string',
          Date: 'string',
          Time: 'string',
          Datetime: 'string',
          JSON: 'string',
          BigInt: 'string',
          BigFloat: 'string',
          Opaque: 'any',
        },
      },
    },
  },
  // hooks: {
  //   afterAllFileWrite: ['npm run lint'],
  // },
}

export default config
