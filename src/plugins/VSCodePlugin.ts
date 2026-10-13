import { BasePlugin, PluginContext } from './DHSEPlugin';

export class VSCodePlugin extends BasePlugin {
  readonly id = 'dhse-vscode-companion';
  readonly name = 'DHSE VSCode Companion';
  readonly version = '2.0.0';

  override async activate(context: PluginContext): Promise<void> {
    await super.activate(context);

    // Register "DHSE: Synthesize Markdown to Handwritten PDF" command
    context.registerCommand({
      id: 'dhse.synthesizeDocument',
      title: 'DHSE: Synthesize Active Document to Handwritten Vector',
      handler: async (markdownContent: string) => {
        context.showToast('Rendering handwritten document via zero-knowledge engine...', 'info');
        const doc = await context.engine.render(markdownContent);
        context.showToast(`Synthesized ${doc.pages.length} page(s) successfully!`, 'success');
        return doc;
      },
    });

    // Register "DHSE: Calibrate Stylus Profile" command
    context.registerCommand({
      id: 'dhse.openCalibration',
      title: 'DHSE: Open Real-Time Drawing Calibration Sandbox',
      handler: () => {
        context.showToast('Launching DHSE Interactive Sandbox...', 'info');
      },
    });
  }
}
