# تطبيق حفظ الأحاديث النبوية

تطبيق ويب لمساعدة المسلمين في حفظ الأحاديث النبوية الشريفة مع إمكانيات التدريب والاختبار.

## المميزات

- إضافة الأحاديث مع الصحابة والمخرجين
- أسئلة عشوائية لاختبار الحفظ
- نوعين من الأسئلة: اختيار متعدد وتكملة النص
- واجهة سهلة الاستخدام باللغة العربية

## التقنيات المستخدمة

- **Frontend**: React with TypeScript
- **Backend**: Go (Golang)
- **Database**: SQLite (للبساطة)

## هيكل المشروع

```
hadith/
├── frontend/     # React application
├── backend/      # Go API server
└── README.md
```

## تشغيل التطبيق

### Backend
```bash
cd backend
go run main.go
```

### Frontend
```bash
cd frontend
npm start
```
