import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Log } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer,
  PlaceholderContent,
  PlaceholderName
} from '@microsoft/sp-application-base';

import * as strings from 'FooterApplicationCustomizerStrings';
import Footer, { IFooterProps } from './components/Footer';

const LOG_SOURCE: string = 'FooterApplicationCustomizer';

export interface IFooterApplicationCustomizerProperties {
  message: string;
  aadClientId: string;
}

export default class FooterApplicationCustomizer
  extends BaseApplicationCustomizer<IFooterApplicationCustomizerProperties> {

  private _bottomPlaceholder: PlaceholderContent | undefined;

  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);

    this.context.placeholderProvider.changedEvent.add(this, this._renderPlaceHolders);
    this._renderPlaceHolders();

    return Promise.resolve();
  }

  private _renderPlaceHolders(): void {
    if (!this._bottomPlaceholder) {
      this._bottomPlaceholder = this.context.placeholderProvider.tryCreateContent(
        PlaceholderName.Bottom,
        { onDispose: this._onDispose.bind(this) }
      );

      if (!this._bottomPlaceholder) {
        Log.error(LOG_SOURCE, new Error('Could not find Bottom placeholder.'));
        return;
      }

      if (this._bottomPlaceholder.domElement) {
        const element: React.ReactElement<IFooterProps> = React.createElement(
          Footer,
          {
            context: this.context,
            aadClientId: this.properties.aadClientId,
            message: this.properties.message
          }
        );

        ReactDom.render(element, this._bottomPlaceholder.domElement);
      }
    }
  }

  private _onDispose(): void {
    Log.info(LOG_SOURCE, 'Disposed footer placeholder.');
    if (this._bottomPlaceholder?.domElement) {
      ReactDom.unmountComponentAtNode(this._bottomPlaceholder.domElement);
    }
  }
}
