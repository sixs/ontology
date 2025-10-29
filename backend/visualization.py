import json
import traceback

from pyvis.network import Network

from convert import convert_jsonld_to_owl, convert_owl_to_jsonld, detect_data_type
from parsers import OWLParser


def generate_visualization_from_owl(owl_data):
    """从OWL数据生成可视化网络图，返回图html、tree层级结构json象、统计信息"""
    try:
        print(f"[DEBUG] 开始生成OWL可视化，数据长度: {len(owl_data)} 字符")
        # 使用OWL解析器
        parser = OWLParser(owl_data)
        if not parser.parse():
            print("[DEBUG] OWL解析失败，无法生成可视化")
            return None, None, [], 0, 0

        # 使用pyvis生成可视化
        net = Network(height="98vh", width="99vw", bgcolor="#ffffff", font_color="black", directed=True)
        net.barnes_hut()
        net.set_options("""
        var options = {
          "height": "100vh",
          "width": "100vw",
          "physics": {
            "enabled": true,
            "stabilization": {
              "iterations": 100
            }
          }
        }
        """)

        # 添加类节点
        print(f"[DEBUG] 开始添加类节点，共 {len(parser.get_classes())} 个类")
        class_stats = _add_class_nodes(net, parser)

        # 添加数据属性节点
        print(f"[DEBUG] 开始添加数据属性节点，共 {len(parser.get_datatype_properties())} 个数据属性")
        dataprop_stats = _add_datatype_property_nodes(net, parser)

        # 添加对象属性节点
        print(f"[DEBUG] 开始添加对象属性节点，共 {len(parser.get_object_properties())} 个对象属性")
        objprop_stats = _add_object_property_nodes(net, parser)

        # 添加限制节点
        print(f"[DEBUG] 开始处理限制节点，共 {len(parser.get_restrictions())} 个限制")
        restriction_count = _add_restriction_nodes(net, parser)

        # 添加subClassOf关系
        print(f"[DEBUG] 开始添加子类关系，共 {len(parser.get_subclass_relations())} 个子类关系")
        subclass_stats = _add_subclass_edges(net, parser)

        # 添加domain和range关系
        print(f"[DEBUG] 开始添加定义域/值域关系，共 {len(parser.get_domain_range_relations())} 个关系")
        domain_range_stats = _add_domain_range_edges(net, parser)

        # 计算统计信息
        total_nodes = sum([class_stats['added'], dataprop_stats['added'], objprop_stats['added'], restriction_count])
        total_edges = sum([subclass_stats['added'], domain_range_stats['added']])

        _print_statistics(class_stats, dataprop_stats, objprop_stats, restriction_count, 
                         subclass_stats, domain_range_stats, total_nodes, total_edges)

        # 生成tree层级结构json
        tree_data = _generate_tree_structure(parser)
        
        # 获取所有三元组关系并按source聚类
        triple_relations = parser.get_all_relations()

        return net.generate_html(), tree_data, triple_relations, total_nodes, total_edges
    except Exception as e:
        print(f"[ERROR] OWL可视化错误: {e}")
        traceback.print_exc()
        raise


def _add_class_nodes(net, parser):
    """添加类节点到网络图"""
    added_count = 0
    filtered_count = 0
    
    for class_uri, class_info in parser.get_classes().items():
        # 过滤意义不明的节点
        if parser._is_meaningless_node(class_uri):
            print(f"[DEBUG] 过滤意义不明的类节点: {class_uri}")
            filtered_count += 1
            continue

        class_name = class_info['name']
        label = _clean_label(class_info['label'], class_name)
        title = f"类: {class_name}"
        if class_info['comment']:
            title += f"\n注释: {class_info['comment']}"

        net.add_node(
            class_uri,
            label=label,
            title=title,
            color={
                'background': '#4CAF50',
                'border': '#388E3C',
                'highlight': {
                    'background': '#66BB6A',
                    'border': '#388E3C'
                }
            },
            shape='box',
            font={'color': 'white', 'size': 14}
        )
        added_count += 1
    
    return {'added': added_count, 'filtered': filtered_count}


def _add_datatype_property_nodes(net, parser):
    """添加数据属性节点到网络图"""
    added_count = 0
    filtered_count = 0
    
    for prop_uri, prop_info in parser.get_datatype_properties().items():
        # 过滤意义不明的节点
        if parser._is_meaningless_node(prop_uri):
            print(f"[DEBUG] 过滤意义不明的数据属性节点: {prop_uri}")
            filtered_count += 1
            continue

        prop_name = prop_info['name']
        label = _clean_label(prop_info['label'], prop_name)
        title = f"数据属性: {prop_name}"
        if prop_info['comment']:
            title += f"\n注释: {prop_info['comment']}"
        if prop_info['domain']:
            title += f"\n定义域: {', '.join([parser._get_local_name(d) for d in prop_info['domain']])}"
        if prop_info['range']:
            title += f"\n值域: {', '.join([parser._get_local_name(r) for r in prop_info['range']])}"

        net.add_node(
            prop_uri,
            label=label,
            title=title,
            color={
                'background': '#2196F3',
                'border': '#1976D2',
                'highlight': {
                    'background': '#42A5F5',
                    'border': '#1976D2'
                }
            },
            shape='ellipse',
            font={'color': 'white', 'size': 12}
        )
        added_count += 1
    
    return {'added': added_count, 'filtered': filtered_count}


def _add_object_property_nodes(net, parser):
    """添加对象属性节点到网络图"""
    added_count = 0
    filtered_count = 0
    
    for prop_uri, prop_info in parser.get_object_properties().items():
        # 过滤意义不明的节点
        if parser._is_meaningless_node(prop_uri):
            print(f"[DEBUG] 过滤意义不明的对象属性节点: {prop_uri}")
            filtered_count += 1
            continue

        prop_name = prop_info['name']
        label = _clean_label(prop_info['label'], prop_name)
        title = f"对象属性: {prop_name}"
        if prop_info['comment']:
            title += f"\n注释: {prop_info['comment']}"
        if prop_info['domain']:
            title += f"\n定义域: {', '.join([parser._get_local_name(d) for d in prop_info['domain']])}"
        if prop_info['range']:
            title += f"\n值域: {', '.join([parser._get_local_name(r) for r in prop_info['range']])}"

        net.add_node(
            prop_uri,
            label=label,
            title=title,
            color={
                'background': '#FF9800',
                'border': '#F57C00',
                'highlight': {
                    'background': '#FFB74D',
                    'border': '#F57C00'
                }
            },
            shape='ellipse',
            font={'color': 'white', 'size': 12}
        )
        added_count += 1
    
    return {'added': added_count, 'filtered': filtered_count}


def _add_restriction_nodes(net, parser):
    """添加限制节点到网络图"""
    restriction_count = 0
    
    for restriction_uri, restriction_info in parser.get_restrictions().items():
        restriction_count += 1
        # 打印限制节点信息日志
        print(f"[DEBUG] 发现限制节点: {restriction_uri}")
        print(f"[DEBUG] 限制详情: {restriction_info}")

        restriction_name = parser._get_local_name(restriction_uri)
        title = f"限制: {restriction_name}"
        if restriction_info['onProperty']:
            title += f"\n属性: {parser._get_local_name(restriction_info['onProperty'])}"
        if restriction_info['someValuesFrom']:
            title += f"\n存在值来自: {parser._get_local_name(restriction_info['someValuesFrom'])}"
        if restriction_info['allValuesFrom']:
            title += f"\n所有值来自: {parser._get_local_name(restriction_info['allValuesFrom'])}"
        if restriction_info['hasValue']:
            title += f"\n值为: {restriction_info['hasValue']}"
        
        net.add_node(
            restriction_uri,
            label=f"限制: {restriction_name}",
            title=title,
            color={
                'background': '#9C27B0',
                'border': '#7B1FA2',
                'highlight': {
                    'background': '#BA68C8',
                    'border': '#7B1FA2'
                }
            },
            shape='diamond',
            font={'color': 'white', 'size': 10}
        )
    
    return restriction_count


def _add_subclass_edges(net, parser):
    """添加子类关系边到网络图"""
    added_count = 0
    filtered_count = 0
    
    for relation in parser.get_subclass_relations():
        # 确保节点存在
        if relation['subclass'] not in net.node_ids or relation['superclass'] not in net.node_ids:
            filtered_count += 1
            continue

        subclass_name = parser._get_local_name(relation['subclass'])
        superclass_name = parser._get_local_name(relation['superclass'])
        net.add_edge(
            relation['subclass'],
            relation['superclass'],
            label='subClassOf',
            title=f"{subclass_name} 是 {superclass_name} 的子类",
            color={'color': '#4CAF50', 'highlight': '#66BB6A'},
            arrows={'to': {'enabled': True, 'scaleFactor': 1}},
            width=2
        )
        added_count += 1
    
    return {'added': added_count, 'filtered': filtered_count}


def _add_domain_range_edges(net, parser):
    """添加定义域和值域关系边到网络图"""
    added_count = 0
    filtered_count = 0
    
    for relation in parser.get_domain_range_relations():
        # 确保节点存在
        if relation['property'] not in net.node_ids or relation['class'] not in net.node_ids:
            filtered_count += 1
            continue

        if relation['type'] == 'domain':
            prop_name = parser._get_local_name(relation['property'])
            class_name = parser._get_local_name(relation['class'])
            net.add_edge(
                relation['property'],
                relation['class'],
                label='domain',
                title=f"{prop_name} 的定义域是 {class_name}",
                color={'color': '#2196F3', 'highlight': '#42A5F5'},
                arrows={'to': {'enabled': True, 'scaleFactor': 0.5}},
                width=1,
                dashes=True
            )
            added_count += 1
        elif relation['type'] == 'range':
            prop_name = parser._get_local_name(relation['property'])
            class_name = parser._get_local_name(relation['class'])
            net.add_edge(
                relation['property'],
                relation['class'],
                label='range',
                title=f"{prop_name} 的值域是 {class_name}",
                color={'color': '#FF9800', 'highlight': '#FFB74D'},
                arrows={'to': {'enabled': True, 'scaleFactor': 0.5}},
                width=1,
                dashes=True
            )
            added_count += 1
    
    return {'added': added_count, 'filtered': filtered_count}


def _clean_label(label, default):
    """清理标签文本，移除引号"""
    if label and isinstance(label, str):
        cleaned = label.strip('"\'')
        return cleaned if cleaned else default
    return default


def _print_statistics(class_stats, dataprop_stats, objprop_stats, restriction_count,
                     subclass_stats, domain_range_stats, total_nodes, total_edges):
    """打印统计信息"""
    print("[DEBUG] 可视化生成完成统计:")
    print(
        f"[DEBUG] - 类节点: {class_stats['added']}/{class_stats['added'] + class_stats['filtered']} (过滤 {class_stats['filtered']} 个)")
    print(
        f"[DEBUG] - 数据属性节点: {dataprop_stats['added']}/{dataprop_stats['added'] + dataprop_stats['filtered']} (过滤 {dataprop_stats['filtered']} 个)")
    print(
        f"[DEBUG] - 对象属性节点: {objprop_stats['added']}/{objprop_stats['added'] + objprop_stats['filtered']} (过滤 {objprop_stats['filtered']} 个)")
    print(f"[DEBUG] - 限制节点: {restriction_count} 个")
    print(
        f"[DEBUG] - 子类关系: {subclass_stats['added']}/{subclass_stats['added'] + subclass_stats['filtered']} (过滤 {subclass_stats['filtered']} 个)")
    print(
        f"[DEBUG] - 定义域/值域关系: {domain_range_stats['added']}/{domain_range_stats['added'] + domain_range_stats['filtered']} (过滤 {domain_range_stats['filtered']} 个)")
    print(f"[DEBUG] - 总节点数: {total_nodes}, 总边数: {total_edges}")


def _generate_tree_structure(parser):
    """根据解析器中的类信息和子类关系生成tree层级结构json"""
    try:
        # 获取类信息和子类关系
        classes = parser.get_classes()
        subclass_relations = parser.get_subclass_relations()
        
        # 构建父子关系映射
        parent_child_map = {}
        for relation in subclass_relations:
            parent = relation['superclass']
            child = relation['subclass']
            if parent not in parent_child_map:
                parent_child_map[parent] = []
            parent_child_map[parent].append(child)
        
        # 创建节点映射
        node_map = {}
        for uri, info in classes.items():
            node_map[uri] = {
                'id': uri,
                'name': info['name'],
                'label': info['label'],
                'comment': info['comment'],
                'children': []
            }
        
        # 建立父子关系
        for parent_uri, children_uris in parent_child_map.items():
            if parent_uri in node_map:
                for child_uri in children_uris:
                    if child_uri in node_map:
                        node_map[parent_uri]['children'].append(node_map[child_uri])
        
        # 找到根节点（没有父节点的节点）
        all_children = set()
        for children in parent_child_map.values():
            all_children.update(children)
        
        root_nodes = []
        for uri in node_map:
            if uri not in all_children:
                root_nodes.append(node_map[uri])
        
        return root_nodes
    except Exception as e:
        print(f"[ERROR] 生成tree结构时出错: {e}")
        traceback.print_exc()
        return []


def generate_visualization(data):
    """统一方法处理OWL和JSON-LD数据并生成可视化HTML和tree层级结构json"""
    # 自动识别数据格式
    data_type = detect_data_type(data)
    
    if data_type == "jsonld":
        try:
            owl_data = convert_jsonld_to_owl(data)
            if not owl_data:
                print("[ERROR] JSON-LD解析失败，无法生成可视化")
                return None
        except Exception as e:
            print(f"[ERROR] JSON-LD转换为HTML时出错: {e}")
            traceback.print_exc()
            return None
    elif data_type == "owl":
        owl_data = data
    else:
        raise ValueError(f"不支持的数据类型: {data_type}")

    try:
        vis_response = generate_visualization_from_owl(owl_data)
        if vis_response:
            # 解包返回值
            graph_html, tree_data, triple_relations, _, _ = vis_response
            return {
                "graph": graph_html,
                "tree": {"name": "Root", "children": tree_data},
                "table": triple_relations
            }
    except Exception as e:
        print(f"[ERROR] 可视化生成失败: {e}")
        traceback.print_exc()
        raise

    return None


if __name__ == "__main__":
    with open("data/RTO-V4.owl", mode="r", encoding="utf-8") as fp1, open("data/test_owl.html", mode="w", encoding="utf-8") as fp2,\
        open("data/test_jsonld.html", mode="w", encoding="utf-8") as fp3, open("data/tree_data.json", mode="w", encoding="utf-8") as fp4:
        owl_data = fp1.read()
        result = generate_visualization(owl_data)
        if result:
            fp2.write(result['html'])
            # 保存tree层级结构json
            json.dump(result['tree_data'], fp4, ensure_ascii=False, indent=2)

        jsonld_data = convert_owl_to_jsonld(owl_data)
        result = generate_visualization(jsonld_data)
        if result:
            fp3.write(result['html'])
            # 注意：对于JSON-LD数据，我们不需要再次保存tree数据，因为它是从相同的OWL数据转换而来

    # with open("data/RTO-V4.json", mode="r", encoding="utf-8") as fp1, open("data/test_jsonld.html", mode="w", encoding="utf-8") as fp2:
    #     html_content = convert_data_to_html(fp1.read())
    #     fp2.write(html_content)
