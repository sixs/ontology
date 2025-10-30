import sqlite3
import json
from datetime import datetime


class OntologyVersion:
    def __init__(self, name, description='', ontology_data='', owl_data='', jsonld_data='', graph='', tree='', table='', id=None):
        self.id = id
        self.name = name
        self.description = description
        self.ontology_data = ontology_data
        self.owl_data = owl_data
        self.jsonld_data = jsonld_data
        self.graph = graph
        self.tree = tree
        self.table = table
        self.created_at = datetime.now()
        self.updated_at = datetime.now()

    @staticmethod
    def init_db(db_path='ontology.db'):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        # 删除现有表（如果存在）
        cursor.execute('DROP TABLE IF EXISTS ontology_versions')
        # 创建新表
        cursor.execute('''
            CREATE TABLE ontology_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                ontology_data TEXT,
                owl_data TEXT,
                jsonld_data TEXT,
                graph TEXT,
                tree TEXT,
                [table] TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        conn.close()

    def save(self, db_path='ontology.db'):
        # 确保graph、tree和table是字符串类型
        graph_str = self.graph if isinstance(self.graph, str) else json.dumps(self.graph)
        tree_str = self.tree if isinstance(self.tree, str) else json.dumps(self.tree)
        table_str = self.table if isinstance(self.table, str) else json.dumps(self.table)
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        if self.id is None:
            cursor.execute('''
                INSERT INTO ontology_versions (name, description, ontology_data, owl_data, jsonld_data, graph, tree, [table], created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (self.name, self.description, self.ontology_data, self.owl_data, self.jsonld_data, graph_str, tree_str, table_str, self.created_at, self.updated_at))
            self.id = cursor.lastrowid
        else:
            cursor.execute('''
                UPDATE ontology_versions
                SET name=?, description=?, ontology_data=?, owl_data=?, jsonld_data=?, graph=?, tree=?, [table]=?, updated_at=?
                WHERE id=?
            ''', (self.name, self.description, self.ontology_data, self.owl_data, self.jsonld_data, graph_str, tree_str, table_str, self.updated_at, self.id))
        conn.commit()
        conn.close()

    @staticmethod
    def get_by_id(id, db_path='ontology.db'):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM ontology_versions WHERE id=?', (id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            # 将row转换为列表以便修改
            row_list = list(row)
            # 将created_at和updated_at转换为datetime对象
            if len(row_list) > 9 and row_list[9]:
                row_list[9] = datetime.fromisoformat(row_list[9])
            if len(row_list) > 10 and row_list[10]:
                row_list[10] = datetime.fromisoformat(row_list[10])
            # 重新构造参数列表，适应新的构造函数
            return OntologyVersion(row_list[1], row_list[2], row_list[3], row_list[4], row_list[5], row_list[6], row_list[7], row_list[8], row_list[0])
        return None

    @staticmethod
    def get_all_basic(page=1, page_size=20, search_term='', db_path='ontology.db'):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        offset = (page - 1) * page_size

        if search_term:
            query = '''
                SELECT id, name, description, created_at, updated_at FROM ontology_versions
                WHERE name LIKE ? OR description LIKE ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            '''
            search_pattern = f'%{search_term}%'
            cursor.execute(query, (search_pattern, search_pattern, page_size, offset))
        else:
            query = '''
                SELECT id, name, description, created_at, updated_at FROM ontology_versions
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            '''
            cursor.execute(query, (page_size, offset))

        rows = cursor.fetchall()
        conn.close()

        versions = []
        for row in rows:
            versions.append({
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'created_at': row[3],
                'updated_at': row[4]
            })
        return versions

    @staticmethod
    def get_all(page=1, page_size=20, search_term='', db_path='ontology.db'):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        offset = (page - 1) * page_size

        if search_term:
            query = '''
                SELECT id, name, description, ontology_data, graph, tree, [table], created_at, updated_at FROM ontology_versions
                WHERE name LIKE ? OR description LIKE ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            '''
            search_pattern = f'%{search_term}%'
            cursor.execute(query, (search_pattern, search_pattern, page_size, offset))
        else:
            query = '''
                SELECT id, name, description, ontology_data, graph, tree, [table], created_at, updated_at FROM ontology_versions
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            '''
            cursor.execute(query, (page_size, offset))

        rows = cursor.fetchall()
        conn.close()

        versions = []
        for row in rows:
            print(row[5])
            versions.append({
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'ontology_data': row[3],
                'owl_data': row[4],
                'jsonld_data': row[5],
                'graph': row[6],
                'tree': json.loads(row[7]),
                'table': json.loads(row[8]),
                'created_at': row[9],
                'updated_at': row[10]
            })

        return versions

    @staticmethod
    def count_all(search_term='', db_path='ontology.db'):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        if search_term:
            query = 'SELECT COUNT(*) FROM ontology_versions WHERE name LIKE ? OR description LIKE ?'
            search_pattern = f'%{search_term}%'
            cursor.execute(query, (search_pattern, search_pattern))
        else:
            query = 'SELECT COUNT(*) FROM ontology_versions'
            cursor.execute(query)

        count = cursor.fetchone()[0]
        conn.close()
        return count

    def delete(self, db_path='ontology.db'):
        if self.id is not None:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute('DELETE FROM ontology_versions WHERE id=?', (self.id,))
            conn.commit()
            conn.close()
            return True
        return False
