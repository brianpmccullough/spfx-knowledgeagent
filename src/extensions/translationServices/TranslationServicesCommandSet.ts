import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Log } from '@microsoft/sp-core-library';
import {
  BaseListViewCommandSet,
  type Command,
  type IListViewCommandSetExecuteEventParameters,
  type ListViewStateChangedEventArgs
} from '@microsoft/sp-listview-extensibility';
import { BaseDialog, type IDialogConfiguration } from '@microsoft/sp-dialog';
import { AadTokenProvider } from '@microsoft/sp-http';

export interface ITranslationServicesCommandSetProperties {
  apiUrl: string;
  aadClientId: string;
}

const LOG_SOURCE: string = 'TranslationServicesCommandSet';

interface ITranslation {
  language: string;
  path: string;
  fileStatus: string;
  hasPublishedVersion: boolean;
}

interface ITranslationStatusResponse {
  siteUrl: string;
  pageId: number;
  path: string;
  version: string;
  translations: ITranslation[];
  untranslatedLanguages: string[];
}

class JsonPreviewDialog extends BaseDialog {
  public jsonText: string = '';

  public render(): void {
    ReactDOM.render(
      React.createElement(
        'div',
        { style: { padding: 16, minWidth: 480 } },
        React.createElement(
          'pre',
          { style: { whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12, maxHeight: 480, overflow: 'auto', margin: 0 } },
          this.jsonText
        ),
        React.createElement(
          'div',
          { style: { marginTop: 16, textAlign: 'right' } },
          React.createElement('button', { onClick: () => { this.close().catch(() => { /* no-op */ }); } }, 'Close')
        )
      ),
      this.domElement
    );
  }

  public getConfig(): IDialogConfiguration {
    return { isBlocking: true };
  }

  protected onAfterClose(): void {
    super.onAfterClose();
    ReactDOM.unmountComponentAtNode(this.domElement);
  }
}

export default class TranslationServicesCommandSet extends BaseListViewCommandSet<ITranslationServicesCommandSetProperties> {

  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, 'Initialized TranslationServicesCommandSet');

    const checkStatusCommand: Command = this.tryGetCommand('COMMAND_1');
    if (checkStatusCommand) {
      checkStatusCommand.visible = false;
    }

    this.context.listView.listViewStateChangedEvent.add(this, this._onListViewStateChanged);

    return Promise.resolve();
  }

  public onExecute(event: IListViewCommandSetExecuteEventParameters): void {
    switch (event.itemId) {
      case 'COMMAND_1':
        this._checkTranslationStatus().catch((err) => {
          Log.error(LOG_SOURCE, err);
        });
        break;
      default:
        throw new Error('Unknown command');
    }
  }

  private async _checkTranslationStatus(): Promise<void> {
    const selectedRow = this.context.listView.selectedRows?.[0];
    if (!selectedRow) return;

    const pageId = selectedRow.getValueByName('ID') as string;
    const siteUrl = this.context.pageContext.site.absoluteUrl;
    const { apiUrl, aadClientId } = this.properties;

    const tokenProvider: AadTokenProvider = await this.context.aadTokenProviderFactory.getTokenProvider();
    const token: string = await tokenProvider.getToken(aadClientId);

    const url = `${apiUrl}/translation/status?siteUrl=${encodeURIComponent(siteUrl)}&pageId=${encodeURIComponent(pageId)}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data: ITranslationStatusResponse = await response.json();

    const dialog = new JsonPreviewDialog();
    dialog.jsonText = JSON.stringify(data, null, 2);
    await dialog.show();
  }

  private _onListViewStateChanged = (_args: ListViewStateChangedEventArgs): void => {
    const checkStatusCommand: Command = this.tryGetCommand('COMMAND_1');
    if (checkStatusCommand) {
      checkStatusCommand.visible = this.context.listView.selectedRows?.length === 1;
      this.raiseOnChange();
    }
  }
}
