# 🧬 Genetic Health AI

An AI-based web and mobile (PWA) system that predicts the likelihood of five genetic disorders from 12 clinical and biomarker inputs. It also provides explainable results (SHAP and LIME) and inheritance analysis for doctors.

---

## 👩‍🎓 Project Information

| | |
|---|---|
| **University** | University of South Asia |
| **Project type** | Final Year Project (FYP) |
| **Students** | Hafsa Hafeez (B-27953), Nimra Shahid (B-27994) |
| **Supervisor** | Sir Taib Ali |

---

## ✨ Features

- **Disease prediction** for 5 disorders: Thalassemia, Hemophilia, Breast Cancer, Sickle Cell Anemia, Cystic Fibrosis
- **Role-based access:** separate Patient and Doctor experiences (role stored in the database and checked at login)
- **JWT authentication** (register / login / protected routes)
- **Confidence and risk band** (High ≥ 70%, Moderate 40–70%, Low < 40%, based on model confidence)
- **Clinical Reasoning (Explainable AI)** for doctors: SHAP and LIME explanations computed on the deployed model and cached
- **Inheritance Analysis** for doctors: Punnett squares and inheritance modes
- **Prediction history** (private to each user)
- **Disease Explorer** and **Recommendations**
- **Knowledge AI chatbot** (Gemini-powered)
- **PDF report download**
- **PWA:** installable on mobile and desktop, responsive layout
- **Sample presets** to quickly fill the prediction form

---

## 🧰 Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, React Router, vite-plugin-pwa, html2canvas, jsPDF |
| Backend | Django, Django REST Framework, SimpleJWT, django-cors-headers |
| Database | SQLite |
| Machine Learning | scikit-learn, LightGBM, CatBoost, SHAP, LIME |
| Chatbot | Google Gemini API |

---

## 🤖 Machine Learning Model

- **Final model:** Stacking ensemble in a scikit-learn pipeline (`FeatureBuilder` + `StackingClassifier`)
- **Base learners:** Extra Trees, Random Forest, SVM, Logistic Regression, LightGBM, CatBoost
- **Meta-learner:** Logistic Regression (5-fold CV)
- **Inputs (12):** Age, Gender, Family_History, Hemoglobin, Fetal_Hemoglobin, RDW_CV, Serum_Ferritin, BRCA1_Expression, p53_Mutation, Sweat_Chloride, Sickled_RBC_Percent, IL6_Level
- **34 model configurations** were compared (classical ML, deep learning, optimized and hybrid models)

| Metric | Value |
|---|---|
| Test accuracy | 93.5% |
| Cross-validation accuracy | 96.1% |
| Macro F1 (test) | 0.935 |
| ROC-AUC (OvR) | 0.968 |
| 20-split mean accuracy | 95.7% ± 1.3% |

**Limitations**
- The dataset is synthetic (1,000 rows).
- There is no "healthy" class, so the model always selects one of the five diseases (closed-set).
- Class labels were mapped from biomarker patterns.

---

## 📁 Project Structure

```
Genetic-Health-AI/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── users/                 # register, login, UserProfile (role)
│   ├── predictions/           # predict, history, explain (SHAP/LIME)
│   │   ├── final_model.pkl
│   │   ├── gh_features.py
│   │   └── ml_artifacts/
│   └── (project settings folder)
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── config.js
│       ├── pages/             # Dashboard, NewPrediction, Results, History, ...
│       ├── components/        # Navbar, GlobalChatbot, ProtectedRoute, ...
│       └── utils/
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/register/` | Create account (with role) |
| POST | `/api/login/` | Login, returns JWT (403 if role does not match) |
| POST | `/api/predictions/predict/` | Run the model and save the prediction |
| GET | `/api/predictions/history/` | Logged-in user's prediction history |
| GET | `/api/predictions/<id>/explain/` | SHAP + LIME explanation (doctor only) |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+ (use the same version the model was trained with if possible)
- Node.js 18+ and npm
- Git

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Genetic-Health-AI
```

### 2. Backend setup
```bash
cd backend
python -m venv venv

# Windows (PowerShell)
venv\Scripts\Activate.ps1
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside `backend/` (copy from `.env.example`) and add your own keys:
```env
SECRET_KEY=your-django-secret-key
GEMINI_API_KEY=your-own-gemini-api-key
```

Run migrations and start the server:
```bash
python manage.py migrate
python manage.py runserver
```
Backend runs at `http://127.0.0.1:8000`.

### 3. Frontend setup
Open a **second terminal**:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`. The Vite dev server proxies `/api` to the Django backend.

### 4. Use the app
1. Open `http://localhost:5173`
2. Sign up as a **Patient** or **Doctor**
3. Log in with the same role
4. Go to **New Prediction**, enter values (or load a preset), and view the result

---

## 📱 Running on Mobile / Other Devices

- **Same Wi-Fi:** run `npm run dev -- --host`, then open `http://<your-laptop-ip>:5173` on the phone. Add the IP to Django `ALLOWED_HOSTS` if needed.
- **Install as an app (PWA):** installation needs **HTTPS** (or localhost). For demos, use a Cloudflare tunnel:
  ```bash
  cloudflared tunnel --url http://localhost:5173
  ```
  Open the generated `https://...trycloudflare.com` link on the phone and choose **Add to Home Screen**.

---

## ☁️ Deployment (Future Work)

The project is currently run locally. Planned deployment:
- **Frontend:** Vercel or Netlify (set `VITE_API_URL` to the backend URL)
- **Backend:** Render or Railway with Gunicorn
- **Database:** PostgreSQL instead of SQLite
- Configure `ALLOWED_HOSTS`, CORS origins, `DEBUG=False`, and environment secrets

---

## 🔐 Security Notes

- Never commit `.env`, API keys, `db.sqlite3`, `venv/` or `node_modules/`.
- Each user can only see their own prediction history.
- The explain endpoint is restricted to doctors and checks record ownership.

---

## 🔮 Future Work

- Train on real, clinically validated data and add a "healthy / no disorder" class
- Deploy to the cloud with HTTPS
- Add more disorders and multi-language support
- Clinical validation and regulatory review

---

## 📄 License

This project is for academic purposes. Add a license (e.g., MIT) if you want others to reuse it.

## 🙏 Acknowledgements

Thanks to our supervisor **Sir Taib Ali** and the **University of South Asia** for guidance and support.