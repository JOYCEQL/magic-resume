import { createFileRoute } from '@tanstack/react-router'
import IframeTemplateViewer from '../../../components/preview/IframeTemplateViewer'

export const Route = createFileRoute('/app/preview-template/$id')({
  component: IframeTemplateViewer,
})
