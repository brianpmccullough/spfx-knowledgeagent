declare interface ITranslationServicesCommandSetStrings {
  Command1: string;
  Command2: string;
}

declare module 'TranslationServicesCommandSetStrings' {
  const strings: ITranslationServicesCommandSetStrings;
  export = strings;
}
