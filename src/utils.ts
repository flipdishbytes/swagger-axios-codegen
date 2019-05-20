import { IDefinitionClass, IDefinitionEnum } from './baseInterfaces';
import { ISwaggerSource } from './swaggerInterfaces';
import _ from 'lodash';

export const GENERIC_SPLIT_KEY = '[';

// 是否是接口类型
export const isGenerics = (s: string) => /^.+\[.+\]$/.test(s);

/**
 * 分解泛型接口
 * @param definitionClassName
 */
export function getGenericsClassNames(definitionClassName: string) {
  const splitIndex = definitionClassName.indexOf(GENERIC_SPLIT_KEY);
  // 泛型基类 PagedResultDto
  const interfaceClassName = definitionClassName.slice(0, splitIndex);
  // 泛型类型 T 的类型名称
  const TClassName = definitionClassName.slice(splitIndex + 1, -1);
  return { interfaceClassName, TClassName };
}

/**
 * 获取引用类型
 * @param s
 */
export function refClassName(s: string) {
  let propType = s.slice(s.lastIndexOf('/') + 1);
  if (isGenerics(propType)) {
    const { interfaceClassName, TClassName } = getGenericsClassNames(propType);
    // return `${interfaceClassName}<${toBaseType(TClassName)}>`
    return trimString(propType.replace(/[`~!@#$%^&*()_+<>?:"{},.\/;'[\]]/g, '_'), '_', 'right');
  } else {
    return propType;
  }
}

export function toBaseType(s: string) {
  if (s === undefined || s === null || s.length === 0) {
    return 'any | null';
  }
  let result = '';
  switch (s) {
    case 'array':
      result = '[]';
      break;
    case 'Int64':
    case 'integer':
      result = 'number';
      break;
    case 'Guid':
    case 'String':
    case 'string':
      result = 'string';
      break;
    case 'file':
      result = 'any';
      break;
    default:
      result = 'any';
      break;
  }
  return result;
}

export function getMethodName(path: string) {
  const paths = path.split('/');
  for (let i = paths.length - 1; i >= 0; i--) {
    if (/\{.+\}/.test(paths[i]) === false) {
      return paths[i];
    }
  }
  return '';
}

export function trimString(str: string, char: string, type: string) {
  if (char) {
    if (type == 'left') {
      return str.replace(new RegExp('^\\' + char + '+', 'g'), '');
    } else if (type == 'right') {
      return str.replace(new RegExp('\\' + char + '+$', 'g'), '');
    }
    return str.replace(new RegExp('^\\' + char + '+|\\' + char + '+$', 'g'), '');
  }
  return str.replace(/^\s+|\s+$/g, '');
}

export function findDeepRefs(
  imports: string[],
  allDefinition: IDefinitionClass[],
  allEnums: IDefinitionEnum[]
) {
  let result: string[] = [];
  imports.forEach((model) => {
    let ref = null;
    ref = allDefinition.find((item) => item.name == model);
    if (ref) {
      result.push(ref.name);
      if (ref.value.imports.length > 0) {
        result = result.concat(findDeepRefs(ref.value.imports, allDefinition, allEnums));
      }
    } else {
      ref = allEnums.find((item) => item.name == model);
      if (ref) {
        result.push(ref.name);
      }
    }
  });
  return result;
}

export type TypeSpec = {
  description: string;
  isEnum: boolean;
  tsType: string;
  target?: string;
  isAtomic?: boolean;
  elementType?: TypeSpec;
  isRef?: boolean;
  isObject?: boolean;
  isArray?: boolean;
  properties?: [];
};
/**
 * Recursively converts a swagger type description into a typescript type, i.e., a model for our mustache
 * template.
 *
 * Not all type are currently supported, but they should be straightforward to add.
 *
 * @param swaggerType a swagger type definition, i.e., the right hand side of a swagger type definition.
 * @returns a recursive structure representing the type, which can be used as a template model.
 */
export const convertType = (swaggerType: any, swaggerDef?: ISwaggerSource) => {
  var typespec: TypeSpec = { description: swaggerType.description, isEnum: false, tsType: '' };

  if (swaggerType.hasOwnProperty('schema')) {
    return convertType(swaggerType.schema, swaggerDef);
  } else if (_.isString(swaggerType.$ref)) {
    typespec.tsType = 'ref';
    typespec.target = swaggerType.$ref.substring(swaggerType.$ref.lastIndexOf('/') + 1);
  } else if (swaggerType.hasOwnProperty('enum')) {
    typespec.tsType = swaggerType.enum
      .map(function(str: string) {
        return JSON.stringify(str);
      })
      .join(' | ');
    typespec.isAtomic = true;
    typespec.isEnum = true;
  } else if (swaggerType.type === 'string') {
    typespec.tsType = 'string';
  } else if (swaggerType.type === 'number' || swaggerType.type === 'integer') {
    typespec.tsType = 'number';
  } else if (swaggerType.type === 'boolean') {
    typespec.tsType = 'boolean';
  } else if (swaggerType.type === 'array') {
    typespec.tsType = 'array';
    typespec.elementType = convertType(swaggerType.items, swaggerDef);
  } /*if (swaggerType.type === 'object')*/ else {
    //remaining types are created as objects
    if (swaggerType.minItems >= 0 && swaggerType.hasOwnProperty('title') && !swaggerType.$ref) {
      typespec.tsType = 'any';
    } else {
      typespec.tsType = 'object';
      typespec.properties = [];

      if (swaggerType.allOf) {
        throw new Error('not implemented!');
        //   _.forEach(swaggerType.allOf, function(ref) {
        //     if (ref.$ref) {
        //       var refSegments = ref.$ref.split('/');
        //       var name = refSegments[refSegments.length - 1];
        //       _.forEach(swagger.definitions, function(definition, definitionName) {
        //         if (definitionName === name) {
        //           var property = convertType(definition, swagger);
        //           Array.prototype.push.apply(typespec.properties, property.properties);
        //         }
        //       });
        //     } else {
        //       var property = convertType(ref);
        //       Array.prototype.push.apply(typespec.properties, property.properties);
        //     }
        //   });
        // }

        // _.forEach(swaggerType.properties, function(propertyType, propertyName) {
        //   var property = convertType(propertyType);
        //   property.name = propertyName;

        //   property.optional = true;
        //   if (swaggerType.required && swaggerType.required.indexOf(propertyName) !== -1) {
        //     property.optional = false;
        //   }

        //   typespec.properties.push(property);
        // });
      }
    } /*else {
   // type unknown or unsupported... just map to 'any'...
   typespec.tsType = 'any';
   }*/
  }

  typespec.isRef = typespec.tsType === 'ref';
  typespec.isObject = typespec.tsType === 'object';
  typespec.isArray = typespec.tsType === 'array';
  typespec.isAtomic =
    typespec.isAtomic || _.includes(['string', 'number', 'boolean', 'any'], typespec.tsType);

  return typespec;
};
