import { Log } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer,
  PlaceholderContent,
  PlaceholderName
} from '@microsoft/sp-application-base';
import { AadTokenProvider } from '@microsoft/sp-http';

import * as strings from 'FooterApplicationCustomizerStrings';

const LOG_SOURCE: string = 'FooterApplicationCustomizer';
const API_URL: string = 'https://vvkqrydmkr.us-east-1.awsapprunner.com/api/me'; //'http://localhost:3000/api/me'; //'https://vvkqrydmkr.us-east-1.awsapprunner.com/api/me';

export interface IFooterApplicationCustomizerProperties {
  message: string;
  aadClientId: string;
}

export default class FooterApplicationCustomizer
  extends BaseApplicationCustomizer<IFooterApplicationCustomizerProperties> {

  private _bottomPlaceholder: PlaceholderContent | undefined;

  public async onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);

    this.context.placeholderProvider.changedEvent.add(this, this._renderPlaceHolders);
    this._renderPlaceHolders();

    await this._callApi();

    return Promise.resolve();
  }

  private async _callApi(): Promise<void> {
    try {
      const aadClientId = this.properties.aadClientId;
      if (!aadClientId) {
        console.error('AAD Client ID not configured');
        return;
      }

      const tokenProvider: AadTokenProvider = await this.context.aadTokenProviderFactory.getTokenProvider();
      const token: string = await tokenProvider.getToken(aadClientId);

      console.log('Token acquired successfully');

      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`API call failed with status: ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log('API Response:', data);
    } catch (error) {
      console.error('Error calling API:', error);
    }
  }

  private _renderPlaceHolders(): void {
    if (!this._bottomPlaceholder) {
      this._bottomPlaceholder = this.context.placeholderProvider.tryCreateContent(
        PlaceholderName.Bottom,
        { onDispose: this._onDispose }
      );

      if (!this._bottomPlaceholder) {
        Log.error(LOG_SOURCE, new Error('Could not find Bottom placeholder.'));
        return;
      }

      if (this._bottomPlaceholder.domElement) {
        const message = this.properties.message || 'SPFx Knowledge Agent';

        this._bottomPlaceholder.domElement.innerHTML = `
          <div style="
            background-color: #0078d4;
            color: white;
            text-align: center;
            padding: 10px;
            font-size: 14px;
          ">
            ${message}
          </div>
        `;
      }
    }
  }

  private _onDispose(): void {
    Log.info(LOG_SOURCE, 'Disposed footer placeholder.');
  }
}
