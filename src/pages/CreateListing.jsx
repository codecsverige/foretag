import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import PageMeta from "../components/PageMeta.jsx";

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const pageTitle = useMemo(() => "Skapa annons", []);

  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(300);
  const [durationMin, setDurationMin] = useState(30);
  const [currency, setCurrency] = useState("SEK");
  const [imageUrl, setImageUrl] = useState("");
  const [phone, setPhone] = useState("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [okId, setOkId] = useState(null);

  const handleLogin = () => {
    sessionStorage.setItem("redirectPath", "/create-ride");
    navigate("/google-auth");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setOkId(null);

    if (!user) {
      handleLogin();
      return;
    }

    if (!companyName.trim()) return setErr("اكتب اسم الشركة");
    if (!city.trim()) return setErr("اكتب المدينة");
    if (!title.trim()) return setErr("اكتب عنوان الإعلان");

    setSaving(true);
    try {
      const payload = {
        // Owner
        createdBy: user.uid,
        createdAt: Date.now(),
        status: "active",

        // Company info
        companyName: companyName.trim(),
        city: city.trim(),
        category: category.trim(),
        phone: phone.trim(),

        // Ad info
        title: title.trim(),
        description: description.trim(),
        price: Number(price) || 0,
        durationMin: Number(durationMin) || 0,
        currency,
        imageUrl: imageUrl.trim(),
      };

      const ref = await addDoc(collection(db, "listings"), payload);
      setOkId(ref.id);
    } catch (e2) {
      setErr(e2?.message || "Kunde inte skapa annons");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <PageMeta title={pageTitle} description="Skapa en annons för ditt företag och få bokningar." />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">إنشاء إعلان شركة</h1>
          <p className="text-gray-600 mt-1">املأ البيانات ثم انشر الإعلان ليظهر في الصفحة الرئيسية.</p>
        </div>
        <Link to="/" className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">
          العودة للرئيسية
        </Link>
      </div>

      {!user ? (
        <div className="mt-5 p-4 rounded-xl border border-gray-200 bg-white text-gray-700">
          أنت الآن بدون تسجيل دخول. اضغط تسجيل الدخول (سيتم تلقائيًا في وضع bypass).
          <button
            onClick={handleLogin}
            className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            تسجيل الدخول
          </button>
        </div>
      ) : null}

      {err ? <div className="mt-4 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">{err}</div> : null}
      {okId ? (
        <div className="mt-4 p-4 rounded-xl border border-green-200 bg-green-50 text-green-800">
          تم نشر الإعلان! ID: <span className="font-mono text-xs">{okId}</span>
          <div className="mt-2">
            <Link to="/" className="underline font-semibold">
              شاهد الإعلان في الرئيسية
            </Link>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 p-5 rounded-2xl border border-gray-200 bg-white space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">اسم الشركة</label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
              placeholder="مثال: Salon Nora"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">المدينة</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
              placeholder="Stockholm"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">التصنيف (اختياري)</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
              placeholder="Beauty / Restaurant / Clinic"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">هاتف (اختياري)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
              placeholder="+46…"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">عنوان الإعلان</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
            placeholder="مثال: Klippning + Styling"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">وصف الإعلان</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 min-h-[120px]"
            placeholder="اكتب ما الذي تقدمه ولماذا العميل يختارك…"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">السعر</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">المدة (دقيقة)</label>
            <input
              type="number"
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">العملة</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
            >
              <option value="SEK">SEK</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">رابط صورة (اختياري)</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200"
            placeholder="https://…"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "ينشر…" : "نشر الإعلان"}
        </button>
      </form>
    </div>
  );
}
