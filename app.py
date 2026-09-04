import os
import time
import base64
from io import BytesIO
from PIL import Image
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, send_file
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient

app = Flask(__name__)
app.secret_key = os.urandom(32).hex()

# ==========================================
# MongoDB Connection (Stable & Optimized Pool)
# ==========================================
MONGO_URI = "mongodb+srv://admin:3DYZunMvuyVbvipl@aws.rhgcybe.mongodb.net/?retryWrites=true&w=majority&appName=aws"

try:
    # تم رفع المهلة لتفادي انقطاع الاتصال أثناء رفع الملفات (Timeout 30s)
    client = MongoClient(
        MONGO_URI,
        maxPoolSize=20,
        connectTimeoutMS=30000,
        socketTimeoutMS=30000,
        serverSelectionTimeoutMS=30000
    )
    db = client['portfolio_db']
    projects_col = db['projects']
    settings_col = db['settings']
    print("Database connected successfully!")
except Exception as e:
    print(f"Database error: {e}")

ADMIN_USERNAME = "Admin"
ADMIN_PASSWORD_HASH = generate_password_hash("Ahmed123")

# دالة لضغط الصور تلقائياً وتصغير حجمها لتفادي مشاكل الاتصال
def compress_and_encode_image(file_storage, max_width=1280, quality=75):
    img = Image.open(file_storage)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    
    # تصغير الأبعاد مع الحفاظ على النسبة
    if img.width > max_width:
        ratio = max_width / float(img.width)
        new_height = int(float(img.height) * float(ratio))
        img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
    
    buffer = BytesIO()
    img.save(buffer, format="JPEG", quality=quality, optimize=True)
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode('utf-8')

def get_site_profile_fast():
    doc = settings_col.find_one({"_id": "profile_data"}, {"cv_base64": 0})
    if not doc:
        return {
            "has_cv": False,
            "cv_filename": "",
            "profile_base64": "",
            "proj_img_topology": "",
            "proj_img_nexus": ""
        }
    return {
        "has_cv": bool(doc.get("has_cv_flag", False) or doc.get("cv_filename")),
        "cv_filename": doc.get("cv_filename", "Ahmed_Attia_Mohamed.pdf"),
        "profile_base64": doc.get("profile_base64", ""),
        "proj_img_topology": doc.get("proj_img_topology", ""),
        "proj_img_nexus": doc.get("proj_img_nexus", "")
    }

# ==========================================
# Routes
# ==========================================
@app.route('/')
def index():
    projects = list(projects_col.find().sort("created_at", -1).limit(20))
    profile_data = get_site_profile_fast()
    return render_template('index.html', projects=projects, profile=profile_data)

@app.route('/cv/download')
def download_cv():
    doc = settings_col.find_one({"_id": "profile_data"}, {"cv_base64": 1, "cv_filename": 1})
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
        return jsonify({"status": "error", "message": "Invalid credentials"}), 401
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
    profile_data = get_site_profile_fast()
    return render_template('admin.html', projects=projects, profile=profile_data)

@app.route('/admin/update_profile_pic', methods=['POST'])
def update_profile_pic():
    if not session.get('admin_logged_in'): return redirect(url_for('login'))
    file = request.files.get('profile_image')
    if file and file.filename != '':
        try:
            # ضغط صورة البروفايل بحجم خفيف جداً
            encoded_img = compress_and_encode_image(file, max_width=500, quality=80)
            settings_col.update_one(
                {"_id": "profile_data"},
                {"$set": {"profile_base64": encoded_img}},
                upsert=True
            )
            flash('Profile picture updated successfully!', 'success')
        except Exception as e:
            flash(f'Error processing image: {e}', 'error')
    return redirect(url_for('admin'))

@app.route('/admin/update_cv', methods=['POST'])
def update_cv():
    if not session.get('admin_logged_in'): return redirect(url_for('login'))
    file = request.files.get('cv_file')
    if file and file.filename.lower().endswith('.pdf'):
        encoded_pdf = base64.b64encode(file.read()).decode('utf-8')
        settings_col.update_one(
            {"_id": "profile_data"},
            {"$set": {
                "cv_base64": encoded_pdf,
                "cv_filename": file.filename,
                "has_cv_flag": True
            }},
            upsert=True
        )
        flash('CV uploaded and saved to DB!', 'success')
    return redirect(url_for('admin'))

@app.route('/admin/update_project_images', methods=['POST'])
def update_project_images():
    if not session.get('admin_logged_in'): return redirect(url_for('login'))
    
    topology_file = request.files.get('topology_image')
    nexus_file = request.files.get('nexus_image')
    
    update_fields = {}
    try:
        if topology_file and topology_file.filename != '':
            update_fields["proj_img_topology"] = compress_and_encode_image(topology_file, max_width=1200, quality=75)
        if nexus_file and nexus_file.filename != '':
            update_fields["proj_img_nexus"] = compress_and_encode_image(nexus_file, max_width=1200, quality=75)
            
        if update_fields:
            settings_col.update_one(
                {"_id": "profile_data"},
                {"$set": update_fields},
                upsert=True
            )
            flash('Project images updated successfully!', 'success')
        else:
            flash('No new images selected.', 'error')
    except Exception as e:
        flash(f'Error processing project images: {e}', 'error')
        
    return redirect(url_for('admin'))

@app.route('/admin/delete_project_image/<img_key>', methods=['POST'])
def delete_project_image(img_key):
    if not session.get('admin_logged_in'): return redirect(url_for('login'))
    if img_key in ['proj_img_topology', 'proj_img_nexus']:
        settings_col.update_one(
            {"_id": "profile_data"},
            {"$set": {img_key: ""}}
        )
        flash('Image removed successfully!', 'success')
    return redirect(url_for('admin'))

@app.route('/admin/add_project', methods=['POST'])
def add_project():
    if not session.get('admin_logged_in'): return redirect(url_for('login'))
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
        flash('Project added!', 'success')
    return redirect(url_for('admin'))

@app.route('/admin/delete_project/<proj_id>', methods=['POST'])
def delete_project(proj_id):
    if not session.get('admin_logged_in'): return redirect(url_for('login'))
    projects_col.delete_one({"_id": proj_id})
    flash('Project deleted!', 'success')
    return redirect(url_for('admin'))

if __name__ == '__main__':
    # use_reloader=False تمنع قفل الـ socket على ويندوز وخطأ WinError 10038
    app.run(debug=True, port=8080, use_reloader=False)
