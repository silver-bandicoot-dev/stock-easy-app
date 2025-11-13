import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { Logo } from '../ui/Logo';

const SupabaseSignup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    industry: '',
    employeeCount: '',
    averageRevenue: '',
    averageSku: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const industryOptions = [
    { value: '', label: 'Sélectionnez un secteur' },
    { value: 'retail', label: 'Distribution / Retail' },
    { value: 'food', label: 'Agroalimentaire' },
    { value: 'fashion', label: 'Mode & Textile' },
    { value: 'electronics', label: 'Électronique' },
    { value: 'pharmaceutical', label: 'Pharmaceutique / Santé' },
    { value: 'manufacturing', label: 'Manufacturing / Industrie' },
    { value: 'other', label: 'Autre' }
  ];

  const employeeOptions = [
    { value: '', label: 'Sélectionnez une tranche' },
    { value: '1-10', label: '1 - 10 employés' },
    { value: '11-50', label: '11 - 50 employés' },
    { value: '51-250', label: '51 - 250 employés' },
    { value: '251-1000', label: '251 - 1 000 employés' },
    { value: '1000+', label: 'Plus de 1 000 employés' }
  ];

  const revenueOptions = [
    { value: '', label: 'Sélectionnez une tranche' },
    { value: '0-250k', label: '0 - 250 K€' },
    { value: '250k-1m', label: '250 K€ - 1 M€' },
    { value: '1m-5m', label: '1 M€ - 5 M€' },
    { value: '5m-20m', label: '5 M€ - 20 M€' },
    { value: '20m+', label: 'Plus de 20 M€' }
  ];

  const skuOptions = [
    { value: '', label: 'Sélectionnez une tranche' },
    { value: '0-500', label: '0 - 500 SKU' },
    { value: '501-2000', label: '501 - 2 000 SKU' },
    { value: '2001-5000', label: '2 001 - 5 000 SKU' },
    { value: '5001-20000', label: '5 001 - 20 000 SKU' },
    { value: '20000+', label: 'Plus de 20 000 SKU' }
  ];

  const handleCompanyInfoChange = (field) => (event) => {
    const { value } = event.target;
    setCompanyInfo((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    const requiredFields = [
      { key: 'name', label: 'Nom de l’entreprise' },
      { key: 'industry', label: 'Secteur d’activité' },
      { key: 'employeeCount', label: "Nombre d'employés" },
      { key: 'averageRevenue', label: 'Chiffre d’affaires moyen' },
      { key: 'averageSku', label: 'Nombre moyen de SKU' }
    ];

    for (const field of requiredFields) {
      if (!companyInfo[field.key]?.toString().trim()) {
        toast.error(`Le champ "${field.label}" est obligatoire`);
        return;
      }
    }

    setLoading(true);

    try {
      const { user, error } = await signup(email, password, {
        company_name: companyInfo.name.trim(),
        company_industry: companyInfo.industry,
        company_employee_count: companyInfo.employeeCount,
        company_average_revenue: companyInfo.averageRevenue,
        company_average_sku: companyInfo.averageSku
      });

      if (error) {
        let errorMessage = 'Erreur lors de l\'inscription';
        if (error.message.includes('already registered')) {
          errorMessage = 'Cet email est déjà utilisé';
        }
        toast.error(errorMessage);
      } else if (user) {
        toast.success('Inscription réussie ! Vérifiez votre email pour confirmer votre compte.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="large" showText={true} theme="light" />
          </div>
          <p className="text-[#6B7280]">Créez votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-[#191919] mb-2">
                Nom de l’entreprise
              </label>
              <input
                id="companyName"
                type="text"
                value={companyInfo.name}
                onChange={handleCompanyInfoChange('name')}
                required
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#191919] focus:border-transparent outline-none transition"
                placeholder="Ex : StockEasy France"
              />
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-[#191919] mb-2">
                Secteur d’activité
              </label>
              <select
                id="industry"
                value={companyInfo.industry}
                onChange={handleCompanyInfoChange('industry')}
                required
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#191919] focus:border-transparent outline-none transition bg-white"
              >
                {industryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="employeeCount" className="block text-sm font-medium text-[#191919] mb-2">
                Nombre d’employés
              </label>
              <select
                id="employeeCount"
                value={companyInfo.employeeCount}
                onChange={handleCompanyInfoChange('employeeCount')}
                required
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#191919] focus:border-transparent outline-none transition bg-white"
              >
                {employeeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="averageRevenue" className="block text-sm font-medium text-[#191919] mb-2">
                Chiffre d’affaires annuel moyen
              </label>
              <select
                id="averageRevenue"
                value={companyInfo.averageRevenue}
                onChange={handleCompanyInfoChange('averageRevenue')}
                required
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#191919] focus:border-transparent outline-none transition bg-white"
              >
                {revenueOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="averageSku" className="block text-sm font-medium text-[#191919] mb-2">
                Nombre moyen de SKU actifs
              </label>
              <select
                id="averageSku"
                value={companyInfo.averageSku}
                onChange={handleCompanyInfoChange('averageSku')}
                required
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#191919] focus:border-transparent outline-none transition bg-white"
              >
                {skuOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#191919] mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#191919] focus:border-transparent outline-none transition"
              placeholder="vous@exemple.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#191919] mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#191919] focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#191919] mb-2">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#191919] focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#191919] text-white py-3 rounded-lg font-medium hover:bg-[#2D2D2D] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-[#6B7280]">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-[#191919] font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupabaseSignup;

