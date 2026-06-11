import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'release', 'scripts/**', 'public/quest-export-sw.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-empty': ['error', { allowEmptyCatch: true }],
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
          allowExportNames: [
            'useBookLayout',
            'useQuestRichTextNavigation',
            'useQuestCanvasHover',
            'useQuestSearch',
            'useQuestGlobalAtlas',
            'useQuestExport',
            'buildChapterDecorationsNode',
          ],
        },
      ],
    },
  },
)
