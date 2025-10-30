import json
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS

from models import OntologyVersion
from visualization import generate_visualization
from convert import detect_data_type, convert_owl_to_jsonld, convert_jsonld_to_owl


def create_app():
    app = Flask(__name__)
    CORS(app)
    OntologyVersion.init_db()  # 启用CORS支持

    # 初始化数据库
    OntologyVersion.init_db()

    @app.route('/api/versions', methods=['GET'])
    def get_versions():
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 20))
        search_term = request.args.get('search', '')

        versions = OntologyVersion.get_all_basic(page, page_size, search_term)
        total = OntologyVersion.count_all(search_term)

        return jsonify({
            'versions': versions,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total': total
            }
        })

    @app.route('/api/versions/<int:id>', methods=['GET'])
    def get_version(id):
        version = OntologyVersion.get_by_id(id)
        if version:
            return jsonify({
                'id': version.id,
                'name': version.name,
                'description': version.description,
                'ontology_data': version.ontology_data,
                'owl_data': version.owl_data,
                'jsonld_data': version.jsonld_data,
                'graph': version.graph,
                'tree': version.tree,
                'table': version.table,
                'created_at': version.created_at.isoformat() if version.created_at else None,
                'updated_at': version.updated_at.isoformat() if version.updated_at else None
            }), 200
        else:
            return jsonify({'error': 'Version not found'}), 404

    @app.route('/api/versions', methods=['POST'])
    def create_version():
        data = request.get_json()

        # 验证必填字段
        errors = []

        if 'name' not in data or not data['name']:
            errors.append('名称是必填项')

        if 'ontology_data' not in data or not data['ontology_data']:
            errors.append('数据内容是必填项')

        # 如果有验证错误，返回详细错误信息
        if errors:
            return jsonify({
                'error': '参数验证失败',
                'details': errors
            }), 400

        # 生成可视化数据
        try:
            visualization_data = generate_visualization(data['ontology_data'])
            if visualization_data is None:
                return jsonify({
                    'error': '生成可视化数据时发生错误',
                    'details': ['无法解析ontology数据']
                }), 500
            graph_data = visualization_data['graph']
            tree_data = visualization_data['tree']
            table_data = visualization_data['table']
                        
            # 检测数据类型并进行相应转换
            data_type = detect_data_type(data['ontology_data'])
            if data_type == "jsonld":
                owl_data = convert_jsonld_to_owl(data['ontology_data'])
                jsonld_data = data['ontology_data']
            else:  # owl
                owl_data = data['ontology_data']
                jsonld_data = convert_owl_to_jsonld(data['ontology_data'])
        except Exception as e:
            return jsonify({
                'error': '生成可视化数据时发生错误',
                'details': [str(e)]
            }), 500

        # 创建新版本
        version = OntologyVersion(
            name=data['name'],
            description=data.get('description', ''),
            ontology_data=data['ontology_data'],
            owl_data=owl_data,
            jsonld_data=jsonld_data,
            graph=graph_data,
            tree=tree_data,
            table=table_data
        )

        try:
            version.save()
        except Exception as e:
            return jsonify({
                'error': '保存版本时发生错误',
                'details': [str(e)]
            }), 500

        # 返回创建的版本详情信息
        # 确保graph、tree和table是字符串类型后再返回
        graph_data = version.graph if isinstance(version.graph, str) else json.dumps(version.graph)
        tree_data = version.tree if isinstance(version.tree, str) else json.dumps(version.tree)
        table_data = version.table if isinstance(version.table, str) else json.dumps(version.table)
        
        return jsonify({
            'id': version.id,
            'name': version.name,
            'description': version.description,
            'ontology_data': version.ontology_data,
            'owl_data': version.owl_data,
            'jsonld_data': version.jsonld_data,
            'graph': graph_data,
            'tree': tree_data,
            'table': table_data,
            'created_at': version.created_at.isoformat(),
            'updated_at': version.updated_at.isoformat()
        }), 201

    @app.route('/api/versions/<int:id>', methods=['PUT'])
    def update_version(id):
        version = OntologyVersion.get_by_id(id)
        if not version:
            return jsonify({'error': 'Version not found'}), 404

        data = request.get_json()

        # 更新字段
        if 'name' in data:
            version.name = data['name']
        if 'description' in data:
            version.description = data['description']
        if 'ontology_data' in data:
            version.ontology_data = data['ontology_data']
            # 重新生成可视化数据和OWL/JSON-LD数据
            try:
                visualization_data = generate_visualization(data['ontology_data'])
                if visualization_data is None:
                    return jsonify({
                        'error': '生成可视化数据时发生错误',
                        'details': ['无法解析ontology数据']
                    }), 500
                version.graph = visualization_data['graph']
                version.tree = visualization_data['tree']
                version.table = visualization_data['table']
                                
                # 检测数据类型并进行相应转换
                data_type = detect_data_type(data['ontology_data'])
                if data_type == "jsonld":
                    version.owl_data = convert_jsonld_to_owl(data['ontology_data'])
                    version.jsonld_data = data['ontology_data']
                else:  # owl
                    version.owl_data = data['ontology_data']
                    version.jsonld_data = convert_owl_to_jsonld(data['ontology_data'])
            except Exception as e:
                return jsonify({
                    'error': '生成可视化数据时发生错误',
                    'details': [str(e)]
                }), 500

        version.updated_at = datetime.now()
        version.save()

        # 返回更新后的版本详情信息
        # 确保graph、tree和table是字符串类型后再返回
        graph_data = version.graph if isinstance(version.graph, str) else json.dumps(version.graph)
        tree_data = version.tree if isinstance(version.tree, str) else json.dumps(version.tree)
        table_data = version.table if isinstance(version.table, str) else json.dumps(version.table)
        
        return jsonify({
            'id': version.id,
            'name': version.name,
            'description': version.description,
            'ontology_data': version.ontology_data,
            'owl_data': version.owl_data,
            'jsonld_data': version.jsonld_data,
            'graph': graph_data,
            'tree': tree_data,
            'table': table_data,
            'created_at': version.created_at.isoformat(),
            'updated_at': version.updated_at.isoformat()
        })

    @app.route('/api/versions/<int:id>', methods=['DELETE'])
    def delete_version(id):
        version = OntologyVersion.get_by_id(id)
        if not version:
            return jsonify({'error': 'Version not found'}), 404

        version.delete()
        return jsonify({'message': 'Version deleted successfully'})

    @app.route('/api/versions/<int:id>/download', methods=['GET'])
    def download_version(id):
        # 获取版本信息
        version = OntologyVersion.get_by_id(id)
        if not version:
            return jsonify({'error': 'Version not found'}), 404

        # 获取ontology_data
        ontology_data = version.ontology_data
        
        # 检测数据类型
        data_type = detect_data_type(ontology_data)
        
        # 根据数据类型进行转换
        if data_type == "owl":
            # 如果是OWL格式，转换为JSON-LD
            owl_data = ontology_data
            jsonld_data = convert_owl_to_jsonld(owl_data)
        else:
            # 如果是JSON-LD格式，转换为OWL
            jsonld_data = ontology_data
            owl_data = convert_jsonld_to_owl(jsonld_data)
        
        # 返回两种格式的数据
        return jsonify({
            'name': version.name,
            'owl_data': owl_data,
            'jsonld_data': jsonld_data
        })

    @app.route('/api/download/<int:id>', methods=['GET'])
    def download_ontology_version(id):
        # 根据ID获取版本
        version = OntologyVersion.get_by_id(id)
        if not version:
            return jsonify({'error': 'Version not found'}), 404

        # 获取本体数据
        ontology_data = version.ontology_data
        if not ontology_data:
            return jsonify({'error': 'No data found in version'}), 400

        # 检测数据类型
        data_type = detect_data_type(ontology_data)

        # 根据数据类型进行转换
        if data_type == "owl":
            # 如果是OWL格式，转换为JSON-LD
            owl_data = ontology_data
            jsonld_data = convert_owl_to_jsonld(owl_data)
        else:
            # 如果是JSON-LD格式，转换为OWL
            jsonld_data = ontology_data
            owl_data = convert_jsonld_to_owl(jsonld_data)

        # 返回两种格式的数据
        return jsonify({
            'name': version.name,
            'owl_data': owl_data,
            'jsonld_data': jsonld_data
        })

    @app.route('/api/visualize', methods=['POST'])
    def visualize():
        data = request.get_json()

        # 获取参数
        version_id = data.get('version_id')
        ontology_data = data.get('ontology_data')

        # 验证参数
        if not version_id and not ontology_data:
            return jsonify({'error': 'Either version_id or ontology_data must be provided'}), 400

        # 如果提供了version_id，则从数据库获取数据
        if version_id:
            version = OntologyVersion.get_by_id(version_id)
            if not version:
                return jsonify({'error': 'Version not found'}), 404

            # 使用版本数据
            if version.ontology_data:
                ontology_data = version.ontology_data
            else:
                return jsonify({'error': 'No data found in version'}), 400

        # 生成可视化
        try:
            visualization_data = generate_visualization(ontology_data)
            if not visualization_data:
                return jsonify({'error': 'Failed to generate visualization'}), 500
            return jsonify(visualization_data)
        except Exception as e:
            return jsonify({'error': f'Visualization generation failed: {str(e)}'}), 500

    return app
