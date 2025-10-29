"""
OWL解析器模块
包含OWLParser和OWLReady2Parser类，用于解析OWL本体数据
"""

import os
import json
import tempfile
import traceback

from owlready2 import get_ontology
from rdflib import Graph, Namespace, RDFS
from pyvis.network import Network
from convert import convert_jsonld_to_owl, convert_owl_to_jsonld

# OWL命名空间
OWL_NS = Namespace("http://www.w3.org/2002/07/owl#")
RDF_NS = Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#")
RDFS_NS = Namespace("http://www.w3.org/2000/01/rdf-schema#")


class OWLParser:
    """OWL本体解析器，正确解析OWL核心概念"""

    def __init__(self, owl_data):
        self.owl_data = owl_data
        self.graph = Graph()
        self.classes = {}
        self.datatype_properties = {}
        self.object_properties = {}
        self.restrictions = {}
        self.subclass_relations = []
        self.domain_range_relations = []

    def parse(self):
        """解析OWL数据"""
        try:
            print(f"[DEBUG] 开始解析OWL数据，数据长度: {len(self.owl_data)} 字符")
            # 直接解析原始OWL数据，不进行清理
            self.graph.parse(data=self.owl_data, format='xml')
            print(f"[DEBUG] OWL图解析完成，包含 {len(self.graph)} 个三元组")

            # 提取OWL核心概念
            self._extract_classes()
            self._extract_properties()
            self._extract_restrictions()
            self._extract_relations()

            print(
                f"[DEBUG] OWL解析完成: {len(self.classes)} 个类, {len(self.datatype_properties)} 个数据属性, {len(self.object_properties)} 个对象属性, {len(self.restrictions)} 个限制")
            return True
        except Exception as e:
            print(f"[ERROR] OWL解析错误: {e}")
            traceback.print_exc()
            raise

    def _extract_classes(self):
        """提取OWL类"""
        print(f"[DEBUG] 开始提取OWL类信息")
        class_count = 0
        for class_uri in self.graph.subjects(RDF_NS.type, OWL_NS.Class):
            class_name = self._get_local_name(class_uri)
            class_info = {
                'uri': str(class_uri),
                'name': class_name,
                'label': self._get_label(class_uri),
                'comment': self._get_comment(class_uri),
                'type': 'Class'
            }
            self.classes[str(class_uri)] = class_info
            class_count += 1
        print(f"[DEBUG] 提取完成: 共找到 {class_count} 个类")

    def _extract_properties(self):
        """提取OWL属性（数据属性和对象属性）"""
        print(f"[DEBUG] 开始提取OWL属性信息")
        datatype_prop_count = 0
        object_prop_count = 0

        # 提取数据属性
        for prop_uri in self.graph.subjects(RDF_NS.type, OWL_NS.DatatypeProperty):
            prop_name = self._get_local_name(prop_uri)
            prop_info = {
                'uri': str(prop_uri),
                'name': prop_name,
                'label': self._get_label(prop_uri),
                'comment': self._get_comment(prop_uri),
                'type': 'DatatypeProperty',
                'domain': self._get_domain(prop_uri),
                'range': self._get_range(prop_uri)
            }
            self.datatype_properties[str(prop_uri)] = prop_info
            datatype_prop_count += 1

        # 提取对象属性
        for prop_uri in self.graph.subjects(RDF_NS.type, OWL_NS.ObjectProperty):
            prop_name = self._get_local_name(prop_uri)
            prop_info = {
                'uri': str(prop_uri),
                'name': prop_name,
                'label': self._get_label(prop_uri),
                'comment': self._get_comment(prop_uri),
                'type': 'ObjectProperty',
                'domain': self._get_domain(prop_uri),
                'range': self._get_range(prop_uri)
            }
            self.object_properties[str(prop_uri)] = prop_info
            object_prop_count += 1

        print(f"[DEBUG] 属性提取完成: {datatype_prop_count} 个数据属性, {object_prop_count} 个对象属性")

    def _extract_restrictions(self):
        """提取OWL限制"""
        print(f"[DEBUG] 开始提取OWL限制信息")
        restriction_count = 0
        for restriction_uri in self.graph.subjects(RDF_NS.type, OWL_NS.Restriction):
            restriction_info = {
                'uri': str(restriction_uri),
                'type': 'Restriction',
                'onProperty': self._get_on_property(restriction_uri),
                'someValuesFrom': self._get_some_values_from(restriction_uri),
                'allValuesFrom': self._get_all_values_from(restriction_uri),
                'hasValue': self._get_has_value(restriction_uri)
            }
            self.restrictions[str(restriction_uri)] = restriction_info
            restriction_count += 1
        print(f"[DEBUG] 限制提取完成: 共找到 {restriction_count} 个限制")

    def _extract_relations(self):
        """提取关系"""
        print(f"[DEBUG] 开始提取OWL关系信息")
        subclass_count = 0
        domain_range_count = 0

        # 提取subClassOf关系
        for subj, obj in self.graph.subject_objects(RDFS.subClassOf):
            if str(obj) in self.classes:  # 确保目标是有效的类
                relation = {
                    'type': 'subClassOf',
                    'subclass': str(subj),
                    'superclass': str(obj)
                }
                self.subclass_relations.append(relation)
                subclass_count += 1

        # 提取domain和range关系
        for prop_type in [OWL_NS.DatatypeProperty, OWL_NS.ObjectProperty]:
            for prop_uri in self.graph.subjects(RDF_NS.type, prop_type):
                # 提取domain
                for domain_class in self.graph.objects(prop_uri, RDFS_NS.domain):
                    relation = {
                        'type': 'domain',
                        'property': str(prop_uri),
                        'class': str(domain_class)
                    }
                    self.domain_range_relations.append(relation)
                    domain_range_count += 1

                # 提取range
                for range_class in self.graph.objects(prop_uri, RDFS_NS.range):
                    relation = {
                        'type': 'range',
                        'property': str(prop_uri),
                        'class': str(range_class)
                    }
                    self.domain_range_relations.append(relation)
                    domain_range_count += 1

        print(f"[DEBUG] 关系提取完成: {subclass_count} 个子类关系, {domain_range_count} 个domain/range关系")

    def _get_local_name(self, uri):
        """获取URI的本地名称"""
        if not uri:
            return "Unknown"
        uri_str = str(uri)

        # 检查是否是意义不明的UUID格式节点
        if self._is_meaningless_node(uri_str):
            print(f"警告: 发现意义不明的节点URI: {uri_str}")
            return "Unknown_Node"

        if '#' in uri_str:
            return uri_str.split('#')[-1]
        elif '/' in uri_str:
            return uri_str.split('/')[-1]
        return uri_str

    def _get_label(self, uri):
        """获取RDFS标签，优先选择中文标签"""
        # 收集所有标签及其语言
        labels = []
        for label in self.graph.objects(uri, RDFS_NS.label):
            labels.append((str(label), getattr(label, 'language', None)))
        
        # 优先选择中文标签
        for label_text, lang in labels:
            if lang == 'zh':
                return label_text
        
        # 其次选择英文标签
        for label_text, lang in labels:
            if lang == 'en':
                return label_text
        
        # 如果没有带语言标签的，返回第一个标签
        if labels:
            return labels[0][0]
            
        # 如果没有任何标签，返回本地名称
        return self._get_local_name(uri)

    def _get_comment(self, uri):
        """获取RDFS注释"""
        for comment in self.graph.objects(uri, RDFS_NS.comment):
            return str(comment)
        return ""

    def _get_domain(self, uri):
        """获取属性的domain"""
        domains = []
        for domain in self.graph.objects(uri, RDFS_NS.domain):
            domains.append(str(domain))
        return domains

    def _get_range(self, uri):
        """获取属性的range"""
        ranges = []
        for range_uri in self.graph.objects(uri, RDFS_NS.range):
            ranges.append(str(range_uri))
        return ranges

    def _get_on_property(self, restriction_uri):
        """获取限制的onProperty"""
        for prop in self.graph.objects(restriction_uri, OWL_NS.onProperty):
            return str(prop)
        return None

    def _get_some_values_from(self, restriction_uri):
        """获取限制的someValuesFrom"""
        for value in self.graph.objects(restriction_uri, OWL_NS.someValuesFrom):
            return str(value)
        return None

    def _get_all_values_from(self, restriction_uri):
        """获取限制的allValuesFrom"""
        for value in self.graph.objects(restriction_uri, OWL_NS.allValuesFrom):
            return str(value)
        return None

    def _get_has_value(self, restriction_uri):
        """获取限制的hasValue"""
        for value in self.graph.objects(restriction_uri, OWL_NS.hasValue):
            return str(value)
        return None

    def _is_meaningless_node(self, uri):
        """检查是否是意义不明的节点URI（如UUID格式）"""
        import re
        # 匹配UUID格式的节点ID，如N018b698f83194c0b83c046e2697f22aa
        uuid_pattern = r'^N[0-9a-f]{32}$'
        if re.match(uuid_pattern, uri):
            return True
        # 匹配其他可能的无意义节点格式
        meaningless_patterns = [
            r'^genid[0-9]+$',  # 自动生成的ID
            r'^_[0-9a-f]+$',  # 匿名节点
        ]
        for pattern in meaningless_patterns:
            if re.match(pattern, uri):
                return True
        return False

    def get_classes(self):
        """获取所有类"""
        return self.classes

    def get_datatype_properties(self):
        """获取所有数据属性"""
        return self.datatype_properties

    def get_object_properties(self):
        """获取所有对象属性"""
        return self.object_properties

    def get_restrictions(self):
        """获取所有限制"""
        return self.restrictions

    def get_subclass_relations(self):
        """获取subClassOf关系"""
        return self.subclass_relations

    def get_domain_range_relations(self):
        """获取domain和range关系"""
        return self.domain_range_relations

    def get_all_relations(self):
        """获取所有三元组关系，按source聚类"""
        # 获取所有三元组
        relations = []
        
        # 添加subClassOf关系
        for relation in self.subclass_relations:
            relations.append({
                'source': relation['subclass'],
                'relation': 'subClassOf',
                'target': relation['superclass']
            })
        
        # 添加domain关系
        for relation in self.domain_range_relations:
            if relation['type'] == 'domain':
                relations.append({
                    'source': relation['property'],
                    'relation': 'domain',
                    'target': relation['class']
                })
        
        # 添加range关系
        for relation in self.domain_range_relations:
            if relation['type'] == 'range':
                relations.append({
                    'source': relation['property'],
                    'relation': 'range',
                    'target': relation['class']
                })
        
        # 按source聚类
        clustered_relations = {}
        for relation in relations:
            source = relation['source']
            if source not in clustered_relations:
                clustered_relations[source] = []
            clustered_relations[source].append({
                'relation': relation['relation'],
                'target': relation['target']
            })
        
        # 转换为所需的格式
        result = []
        for source, relations in clustered_relations.items():
            result.append({
                'source': source,
                'relations': relations
            })
        
        return result


class OWLReady2Parser:
    """使用owlready2库解析OWL本体数据，返回结构化JSON"""

    def __init__(self, owl_data):
        self.owl_data = owl_data
        self.ontology = None
        self.result = {
            'classes': [],
            'properties': [],
            'individuals': [],
            'hierarchy': []
        }

    def parse(self):
        """解析OWL数据并返回结构化JSON"""
        try:
            print(f"[DEBUG] OWLReady2Parser开始解析OWL数据，数据长度: {len(self.owl_data)} 字符")
            # 创建临时文件来加载OWL数据
            temp_file = 'temp_ontology.owl'
            with open(temp_file, 'w', encoding='utf-8') as f:
                f.write(str(self.owl_data))
            print(f"[DEBUG] 临时文件创建完成: {temp_file}")

            # 使用owlready2加载本体
            self.ontology = get_ontology(temp_file).load()
            print(f"[DEBUG] 本体加载完成，类数量: {len(list(self.ontology.classes()))}")

            # 解析各类信息
            self._extract_classes()
            self._extract_properties()
            self._extract_individuals()
            self._extract_hierarchy()

            # 清理临时文件
            os.remove(temp_file)
            print(f"[DEBUG] 临时文件已清理")

            print(
                f"[DEBUG] OWLReady2解析完成: {len(self.result['classes'])} 个类, {len(self.result['properties'])} 个属性, {len(self.result['individuals'])} 个个体")
            return self.result

        except Exception as e:
            print(f"[ERROR] OWLReady2解析错误: {e}")
            traceback.print_exc()
            # 清理临时文件
            if os.path.exists('temp_ontology.owl'):
                os.remove('temp_ontology.owl')
                print(f"[DEBUG] 错误后清理临时文件")
            raise

    def _extract_classes(self):
        """提取类信息"""
        print(f"[DEBUG] 开始提取类信息")
        class_count = 0
        for cls in self.ontology.classes():
            class_info = {
                'uri': str(cls.iri),
                'name': cls.name,
                'label': self._get_label(cls),
                'comment': self._get_comment(cls),
                'type': 'Class'
            }
            self.result['classes'].append(class_info)
            class_count += 1
        print(f"[DEBUG] 类信息提取完成: {class_count} 个类")

    def _extract_properties(self):
        """提取属性信息"""
        print(f"[DEBUG] 开始提取属性信息")
        data_prop_count = 0
        object_prop_count = 0

        # 数据属性
        for prop in self.ontology.data_properties():
            # 处理数据类型属性的范围
            range_info = None
            if prop.range:
                if hasattr(prop.range, 'iri'):
                    range_info = str(prop.range.iri)
                elif isinstance(prop.range, list) and len(prop.range) > 0:
                    # 如果范围是一个列表，取第一个元素
                    range_item = prop.range[0]
                    if hasattr(range_item, 'iri'):
                        range_info = str(range_item.iri)
            
            prop_info = {
                'uri': str(prop.iri),
                'name': prop.name,
                'label': self._get_label(prop),
                'comment': self._get_comment(prop),
                'type': 'DatatypeProperty',
                'domain': [str(d.iri) for d in prop.domain] if prop.domain else [],
                'range': range_info
            }
            self.result['properties'].append(prop_info)
            data_prop_count += 1

        # 对象属性
        for prop in self.ontology.object_properties():
            # 处理对象属性的范围
            range_info = None
            if prop.range:
                if hasattr(prop.range, 'iri'):
                    range_info = str(prop.range.iri)
                elif isinstance(prop.range, list) and len(prop.range) > 0:
                    # 如果范围是一个列表，取第一个元素
                    range_item = prop.range[0]
                    if hasattr(range_item, 'iri'):
                        range_info = str(range_item.iri)
            
            prop_info = {
                'uri': str(prop.iri),
                'name': prop.name,
                'label': self._get_label(prop),
                'comment': self._get_comment(prop),
                'type': 'ObjectProperty',
                'domain': [str(d.iri) for d in prop.domain] if prop.domain else [],
                'range': range_info
            }
            self.result['properties'].append(prop_info)
            object_prop_count += 1

        print(f"[DEBUG] 属性信息提取完成: {data_prop_count} 个数据属性, {object_prop_count} 个对象属性")

    def _extract_individuals(self):
        """提取个体信息"""
        print(f"[DEBUG] 开始提取个体信息")
        indiv_count = 0
        for indiv in self.ontology.individuals():
            indiv_info = {
                'uri': str(indiv.iri),
                'name': indiv.name,
                'label': self._get_label(indiv),
                'comment': self._get_comment(indiv),
                'type': 'Individual',
                'classes': [str(cls.iri) for cls in indiv.is_a]
            }
            self.result['individuals'].append(indiv_info)
            indiv_count += 1
        print(f"[DEBUG] 个体信息提取完成: {indiv_count} 个个体")

    def _extract_hierarchy(self):
        """提取类层次结构"""
        print(f"[DEBUG] 开始提取层次结构信息")
        hierarchy_count = 0
        for cls in self.ontology.classes():
            for parent in cls.is_a:
                if hasattr(parent, 'iri'):  # 确保是类而不是其他类型
                    hierarchy_info = {
                        'child': str(cls.iri),
                        'parent': str(parent.iri),
                        'relation': 'subClassOf'
                    }
                    self.result['hierarchy'].append(hierarchy_info)
                    hierarchy_count += 1
        print(f"[DEBUG] 层次结构提取完成: {hierarchy_count} 个关系")

    def _get_label(self, entity):
        """获取实体的标签"""
        if hasattr(entity, 'label') and entity.label:
            label = str(entity.label[0]) if entity.label else entity.name
            # 移除引号
            if label and isinstance(label, str):
                label = label.strip('"\'')
            return label
        return entity.name

    def _get_comment(self, entity):
        """获取实体的注释"""
        if hasattr(entity, 'comment') and entity.comment:
            comment = str(entity.comment[0]) if entity.comment else ""
            # 移除引号
            if comment and isinstance(comment, str):
                comment = comment.strip('"\'')
            return comment
        return ""