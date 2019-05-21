export interface ISwaggerSource {
  swagger: string;
  info: {
    title: string;
    description?: string;
    version: string;
  };
  host: string;
  basePath?: string;
  schemes: string[];
  produces?: string[];
  consumes?: string[];

  paths: IPaths;
  definitions: IDefinitions;

  securityDefinitions: { [key: string]: any };
  externalDocs: string;
  security?: string[];
  parameters?: any[];
}

export interface IPaths {
  [url: string]: IRequestUrl;
}

export interface IRequestUrl {
  [method: string]: IRequestMethod;
}

export interface IRequestMethod {
  tags: string[];
  summary: string;
  description: string;
  operationId?: string;
  consumes: string[];
  produces: string[];
  parameters: IParameter[];
  security?: any[];
  externalDocs?: string;
  responses: {
    [key: string]: {
      description: string;
      schema: {
        $ref: string;
        type?: string;
        items?: IParameterItems;
      };
    };
  };
}

export type IParameterIn = 'path' | 'formData' | 'query' | 'body' | 'header';

export interface IParameter {
  in: IParameterIn;
  name: string;
  description: string;
  required: string;
  schema: IParameterSchema;
  items: {
    type: string;
    $ref: string;
  };
  type: string;
  format: string;
  $ref?: string;
  enum?: string[];
}

export interface IParameterSchema {
  $ref: string;
  items?: IParameterItems;
  type: string;
}

export interface IParameterItems {
  type?: string;
  $ref: string;
  items?: IParameterItems;
}

export interface IDefinitions {
  [key: string]: IDefinition;
}

export interface IDefinition {
  required: string[];
  type: 'object' | 'array';
  properties: IDefinitionProperties;
  enum: any[];
  items: IDefinitionProperty;
}

export interface IDefinitionProperties {
  [key: string]: IDefinitionProperty;
}
export interface IDefinitionProperty {
  type: string;
  enum: any[];
  format: string;
  maxLength: number;
  $ref: string;
  items: IDefinitionProperty;
  description: string;
}
