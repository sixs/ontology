import json

from rdflib import Graph, URIRef, Literal
from rdflib.namespace import RDF, RDFS, OWL


class JSONLDToOWLConverter:
    def __init__(self):
        self.graph = Graph()
        self.context = {}

    def convert(self, json_ld_data):
        """将JSON-LD数据转换为OWL格式"""
        try:
            # 解析JSON-LD数据
            if isinstance(json_ld_data, str):
                data = json.loads(json_ld_data)
            else:
                data = json_ld_data

            # 处理上下文
            if '@context' in data:
                self.context = data['@context']

            # 处理@graph中的数据
            if '@graph' in data:
                graph_data = data['@graph']
                if isinstance(graph_data, list):
                    for item in graph_data:
                        self._process_item(item)
                else:
                    self._process_item(graph_data)
            else:
                # 直接处理顶层对象
                self._process_item(data)

            # 返回OWL格式的字符串
            return self.graph.serialize(format='xml')
        except Exception as e:
            raise Exception(f"转换失败: {str(e)}")

    def _process_item(self, item):
        """处理单个JSON-LD项"""
        if not isinstance(item, dict):
            return

        subject_id = item.get('@id')
        if not subject_id:
            return

        subject = URIRef(subject_id)

        # 处理类型
        if '@type' in item:
            types = item['@type']
            if isinstance(types, str):
                types = [types]

            for type_uri in types:
                # 如果是OWL类或属性，添加相应的RDF类型
                if type_uri == 'owl:Class':
                    self.graph.add((subject, RDF.type, OWL.Class))
                elif type_uri == 'owl:DatatypeProperty':
                    self.graph.add((subject, RDF.type, OWL.DatatypeProperty))
                elif type_uri == 'owl:ObjectProperty':
                    self.graph.add((subject, RDF.type, OWL.ObjectProperty))
                elif type_uri == 'owl:Restriction':
                    self.graph.add((subject, RDF.type, OWL.Restriction))
                else:
                    # 一般类或概念
                    type_ref = self._resolve_uri(type_uri)
                    self.graph.add((subject, RDF.type, type_ref))

        # 处理其他属性
        for key, value in item.items():
            if key.startswith('@'):
                continue

            predicate = self._resolve_uri(key)

            if isinstance(value, list):
                for val in value:
                    self._add_triple(subject, predicate, val)
            else:
                self._add_triple(subject, predicate, value)

    def _add_triple(self, subject, predicate, value):
        """添加三元组到图中"""
        if isinstance(value, dict):
            if '@id' in value:
                obj = URIRef(value['@id'])
                self.graph.add((subject, predicate, obj))
            elif '@value' in value:
                # 处理带类型的文字
                literal_value = value['@value']
                if literal_value is not None:
                    if '@type' in value:
                        datatype = self._resolve_uri(value['@type'])
                        obj = Literal(literal_value, datatype=datatype)
                    else:
                        obj = Literal(literal_value)
                    self.graph.add((subject, predicate, obj))
            else:
                # 处理语言标签对象，如 {"zh": "化学物质", "en": "Chemical Substance"}
                for lang, text in value.items():
                    obj = Literal(text, lang=lang)
                    self.graph.add((subject, predicate, obj))
        else:
            # 简单值
            if isinstance(value, str) and (value.startswith('http') or ':' in value):
                # 可能是URI
                obj = URIRef(value)
            else:
                # 文字值
                obj = Literal(str(value))
            self.graph.add((subject, predicate, obj))

    def _resolve_uri(self, uri):
        """解析URI，处理前缀"""
        if isinstance(uri, str):
            # 检查是否有命名空间前缀
            if ':' in uri and not uri.startswith('http'):
                prefix, local_part = uri.split(':', 1)
                if prefix in self.context:
                    base_uri = self.context[prefix]
                    if isinstance(base_uri, dict):
                        base_uri = base_uri.get('@id', base_uri)
                    return URIRef(base_uri + local_part)
                else:
                    # 如果前缀不在上下文中，则将其视为RDFS命名空间的一部分
                    return URIRef(RDFS._NS + local_part)
            elif not uri.startswith('http'):
                # 如果没有命名空间前缀，则将其视为RDFS命名空间的一部分
                return URIRef(RDFS._NS + uri)
            return URIRef(uri)
        return URIRef(str(uri))


class OWLToJSONLDConverter:
    def __init__(self):
        self.graph = Graph()
        self.context = {
            "rdf": str(RDF),
            "rdfs": str(RDFS),
            "owl": str(OWL),
            "xsd": "http://www.w3.org/2001/XMLSchema#"
        }

    def convert(self, owl_data):
        """将OWL数据转换为JSON-LD格式"""
        try:
            # 解析OWL数据
            if isinstance(owl_data, str):
                self.graph.parse(data=owl_data, format='xml')
            else:
                # 假设owl_data是一个文件路径
                self.graph.parse(owl_data, format='xml')

            # 构建JSON-LD结构
            json_ld = {
                "@context": self.context,
                "@graph": []
            }

            # 获取所有唯一的主体
            subjects = set()
            for s, p, o in self.graph:
                subjects.add(s)

            # 为每个主体构建条目
            for subject in subjects:
                entry = {"@id": str(subject)}

                # 获取主体的所有属性和值
                for p, o in self.graph.predicate_objects(subject):
                    predicate = str(p)

                    # 处理对象
                    if isinstance(o, Literal):
                        value = self._process_literal(o)
                    else:
                        value = str(o)

                    # 添加到条目中
                    if predicate in entry:
                        # 如果属性已存在，转换为列表
                        if not isinstance(entry[predicate], list):
                            entry[predicate] = [entry[predicate]]
                        entry[predicate].append(value)
                    else:
                        entry[predicate] = value

                json_ld["@graph"].append(entry)

            return json.dumps(json_ld, ensure_ascii=False, indent=2)
        except Exception as e:
            raise Exception(f"转换失败: {str(e)}")

    def _process_literal(self, literal):
        """处理文字值，包括语言标签和数据类型"""
        value = str(literal)

        # 检查语言标签
        if hasattr(literal, 'language') and literal.language:
            return {
                "@value": value,
                "@language": literal.language
            }

        # 检查数据类型
        if hasattr(literal, 'datatype') and literal.datatype:
            return {
                "@value": value,
                "@type": str(literal.datatype)
            }

        return value


def convert_jsonld_to_owl(json_ld_data):
    """便捷函数：将JSON-LD数据转换为OWL格式"""
    converter = JSONLDToOWLConverter()
    return converter.convert(json_ld_data)


def convert_owl_to_jsonld(owl_data):
    """便捷函数：将OWL数据转换为JSON-LD格式"""
    converter = OWLToJSONLDConverter()
    return converter.convert(owl_data)


def detect_data_type(data):
    """检测数据类型是OWL还是JSON-LD"""
    # 检查是否为JSON-LD格式
    try:
        parsed_data = json.loads(data)
        # JSON-LD通常有@context字段
        if isinstance(parsed_data, dict) and ('@context' in parsed_data or '@graph' in parsed_data):
            return "jsonld"
        # 如果是列表且包含@id等JSON-LD特征字段
        elif isinstance(parsed_data, list) and len(parsed_data) > 0 and isinstance(parsed_data[0], dict) and '@id' in parsed_data[0]:
            return "jsonld"
    except json.JSONDecodeError:
        # 不是有效的JSON，可能是OWL格式
        pass
    
    # 检查是否为OWL格式（XML）
    if data.strip().startswith('<?xml') or '<rdf:RDF' in data or 'xmlns:owl' in data:
        return "owl"
    
    # 默认假设为OWL格式
    return "owl"