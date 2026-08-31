import os
import time
import urllib.parse
import base64
from io import BytesIO
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, send_file
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient

app = Flask(__name__)
app.secret_key = os.urandom(32).hex()

# ==========================================
# MongoDB Atlas Connection
# ==========================================
username = urllib.parse.quote_plus('ahmedosman')
password = urllib.parse.quote_plus('i-fn@bBHV7rXMYj')
MONGO_URI = f"mongodb+srv://{username}:{password}@cluster0.8wawfsu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

try:
    client = MongoClient(MONGO_URI)
    db = client['portfolio_db']
    projects_col = db['projects']
    settings_col = db['settings']
    client.admin.command('ping')
    print("Database connected successfully!")
except Exception as e:
    print(f"Database connection error: {e}")

# Admin Credentials
ADMIN_USERNAME = "Admin"
ADMIN_PASSWORD_HASH = generate_password_hash("Ahmed123")

def get_site_profile():
    doc = settings_col.find_one({"_id": "profile_data"})
    if not doc:
        return {"has_cv": False, "cv_filename": "", "profile_base64": ""}
    return {
        "has_cv": bool(doc.get("cv_base64")),
        "cv_filename": doc.get("cv_filename", "Ahmed_Attia_Mohamed.pdf"),
        "profile_base64": doc.get("profile_base64", "")
    }

# ==========================================
# Routes
# ==========================================
@app.route('/')
def index():
    projects = list(projects_col.find().sort("created_at", -1))
    profile_data = get_site_profile()
    return render_template('index.html', projects=projects, profile=profile_data)

@app.route('/cv/download')
def download_cv():
    doc = settings_col.find_one({"_id": "profile_data"})
    if not doc or not doc.get("cv_base64"):
        return redirect(url_for('index'))
    
    cv_bytes = base64.b64decode(doc["cv_base64"])
    filename = doc.get("cv_filename", "Ahmed_Attia_Mohamed.pdf")
    return send_file(
        BytesIO(cv_bytes),
        mimetype='application/pdf',
        as_attachment=False,
        download_name=filename
    )

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = request.form.get('username')
        pwd = request.form.get('password')
        if user == ADMIN_USERNAME and check_password_hash(ADMIN_PASSWORD_HASH, pwd):
            session['admin_logged_in'] = True
            return jsonify({"status": "success"})
        return jsonify({"status": "error", "message": "Invalid login credentials"}), 401
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('index'))

@app.route('/admin')
def admin():
    if not session.get('admin_logged_in'):
        return redirect(url_for('login'))
    projects = list(projects_col.find().sort("created_at", -1))
    profile_data = get_site_profile()
    return render_template('admin.html', projects=projects, profile=profile_data)

@app.route('/admin/update_profile_pic', methods=['POST'])
def update_profile_pic():
    if not session.get('admin_logged_in'): 
        return redirect(url_for('login'))
    file = request.files.get('profile_image')
    if file and file.filename != '':
        encoded_img = base64.b64encode(file.read()).decode('utf-8')
        settings_col.update_one(
            {"_id": "profile_data"},
            {"$set": {"profile_base64": encoded_img}},
            upsert=True
        )
        flash('Profile picture updated successfully!', 'success')
    return redirect(url_for('admin'))

@app.route('/admin/update_cv', methods=['POST'])
def update_cv():
    if not session.get('admin_logged_in'): 
        return redirect(url_for('login'))
    
    file = request.files.get('cv_file')
    if file and file.filename.lower().endswith('.pdf'):
        encoded_pdf = base64.b64encode(file.read()).decode('utf-8')
        settings_col.update_one(
            {"_id": "profile_data"},
            {"$set": {
                "cv_base64": encoded_pdf,
                "cv_filename": file.filename
            }},
            upsert=True
        )
        flash('CV PDF uploaded and saved to database successfully!', 'success')
    return redirect(url_for('admin'))

@app.route('/admin/add_project', methods=['POST'])
def add_project():
    if not session.get('admin_logged_in'): 
        return redirect(url_for('login'))
    
    title = request.form.get('title')
    category = request.form.get('category')
    description = request.form.get('description')
    tags = request.form.get('tags')
    
    if title and description:
        tag_list = [t.strip() for t in tags.split(',') if t.strip()] if tags else []
        project_data = {
            "_id": f"proj_{int(time.time())}",
            "title": title,
            "category": category,
            "description": description,
            "tags": tag_list,
            "created_at": time.time()
        }
        projects_col.insert_one(project_data)
        flash('Project lab added successfully!', 'success')
    return redirect(url_for('admin'))

@app.route('/admin/delete_project/<proj_id>', methods=['POST'])
def delete_project(proj_id):
    if not session.get('admin_logged_in'): 
        return redirect(url_for('login'))
    projects_col.delete_one({"_id": proj_id})
    flash('Project deleted successfully!', 'success')
    return redirect(url_for('admin'))

if __name__ == '__main__':
    app.run(debug=True, port=8080)