import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Database,
  Download,
  Eye,
  FileText,
  Gauge,
  LineChart as LineIcon,
  Lock,
  LogOut,
  PackagePlus,
  Pencil,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  X
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { api, socketBaseUrl } from './services/api';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const number = new Intl.NumberFormat('en-US');
const DEMO_MODE = import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS === 'true';

const emptyDashboard = {
  generatedAt: new Date().toISOString(),
  stats: {
    trackedProducts: 0,
    competitors: 0,
    activeAlerts: 0,
    atRiskSkus: 0,
    averageMargin: 0,
    priceChanges24h: 0
  },
  trend: ['24h', '18h', '12h', '6h', 'Now'].map((label) => ({ label, ourIndex: 0, marketIndex: 0 })),
  categoryPerformance: [],
  opportunities: [],
  alerts: []
};

const emptyProducts = {
  items: [],
  total: 0,
  page: 1,
  limit: 50,
  categories: []
};

const demoAccounts = DEMO_MODE ? [
  { role: 'Admin', email: 'admin@pricepulse.com', password: 'admin123', detail: 'Full control over users, products, alerts, and infrastructure.' },
  { role: 'Analyst', email: 'analyst@pricepulse.com', password: 'analyst123', detail: 'Can manage products, price observations, alerts, and reports.' },
  { role: 'Client', email: 'client@pricepulse.com', password: 'client123', detail: 'Read-only business view for decision makers.' }
] : [];

const initialProductForm = {
  sku: '',
  name: '',
  category: '',
  brand: '',
  channel: 'Marketplace',
  ourPrice: '',
  cost: '',
  targetMargin: 35,
  stock: 0,
  status: 'watch'
};

const statusStyles = {
  healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  watch: 'bg-amber-50 text-amber-700 border-amber-200',
  action: 'bg-rose-50 text-rose-700 border-rose-200',
  opportunity: 'bg-indigo-50 text-indigo-700 border-indigo-200'
};

const severityStyles = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700'
};

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: DEMO_MODE ? 'client@pricepulse.com' : '',
    password: DEMO_MODE ? 'client123' : ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const session = mode === 'login'
        ? await api.login({ email: form.email, password: form.password })
        : await api.signup(form);
      onLogin(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setMode('login');
    setForm((current) => ({ ...current, email: account.email, password: account.password }));
  };

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-ink">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between bg-[#17211b] px-6 py-8 text-white md:px-12">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-mint p-2 text-moss">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-semibold">PricePulse Intelligence</p>
              <p className="text-sm text-white/60">Real-time pricing command center</p>
            </div>
          </div>

          <div className="my-16 max-w-2xl">
            <p className="text-sm font-semibold uppercase text-mint">Price intelligence for every seller</p>
            <h1 className="mt-4 text-4xl font-semibold md:text-6xl">Know when to protect sales, lift margin, or hold steady.</h1>
            <p className="mt-5 max-w-xl text-lg text-white/70">
              Create a workspace, add the products you sell, compare competitor prices, and get plain-language next steps without technical setup.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {['Private workspace', 'Simple product tracking', 'Clear reports'].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm font-semibold">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-white/50">Built for business users who need pricing answers quickly.</p>
        </section>

        <section className="flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-xl rounded-lg border border-stone-200 bg-white p-6 shadow-soft">
            <div className="flex rounded-lg bg-stone-100 p-1">
              {['login', 'signup'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`h-10 flex-1 rounded-md text-sm font-semibold capitalize ${mode === item ? 'bg-white text-ink shadow-sm' : 'text-stone-500'}`}
                >
                  {item}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === 'signup' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-stone-600">
                    Name
                    <input className="mt-1 h-11 w-full rounded-lg border border-stone-200 px-3 outline-none focus:border-moss" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </label>
                  <label className="block text-sm font-medium text-stone-600">
                    Company
                    <input className="mt-1 h-11 w-full rounded-lg border border-stone-200 px-3 outline-none focus:border-moss" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                  </label>
                  <div className="rounded-lg border border-mint bg-mint/40 p-3 text-sm text-moss sm:col-span-2">
                    Public signup creates a secure Client workspace. Admin and Analyst accounts are invited by an existing admin.
                  </div>
                </div>
              )}

              <label className="block text-sm font-medium text-stone-600">
                Email
                <input className="mt-1 h-11 w-full rounded-lg border border-stone-200 px-3 outline-none focus:border-moss" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label className="block text-sm font-medium text-stone-600">
                Password
                <input type="password" className="mt-1 h-11 w-full rounded-lg border border-stone-200 px-3 outline-none focus:border-moss" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </label>

              {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

              <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ink text-sm font-semibold text-white hover:bg-moss">
                <Lock className="h-4 w-4" />
                {loading ? 'Please wait' : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            {DEMO_MODE && (
            <div className="mt-6 border-t border-stone-200 pt-5">
              <p className="text-sm font-semibold text-stone-700">Demo access</p>
              <div className="mt-3 grid gap-3">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => fillDemo(account)}
                    className="rounded-lg border border-stone-200 p-3 text-left hover:border-moss hover:bg-mint/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink">{account.role}</span>
                      <span className="text-xs text-stone-500">{account.email}</span>
                    </div>
                    <p className="mt-1 text-sm text-stone-500">{account.detail}</p>
                  </button>
                ))}
              </div>
            </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ icon: Icon, label, value, tone, detail }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm text-stone-500">{detail}</p>
    </section>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex min-w-24 items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusStyles[status] || statusStyles.watch}`}>
      {status}
    </span>
  );
}

function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState(product ? {
    sku: product.sku,
    name: product.name,
    category: product.category,
    brand: product.brand,
    channel: product.channel,
    ourPrice: product.ourPrice,
    cost: product.cost || Math.max(1, product.ourPrice * 0.6).toFixed(2),
    targetMargin: product.targetMargin || 35,
    stock: product.stock,
    status: product.status
  } : initialProductForm);

  const submit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      ourPrice: Number(form.ourPrice),
      cost: Number(form.cost),
      targetMargin: Number(form.targetMargin),
      stock: Number(form.stock)
    }, product);
  };

  return (
    <Modal title={product ? 'Edit product' : 'Add tracked product'} onClose={onClose}>
      {!product && (
        <p className="mb-4 rounded-lg border border-mint bg-mint/30 p-3 text-sm text-moss">
          Add the product you sell. After saving, PricePulse will ask for one competitor price to start recommendations.
        </p>
      )}
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {[
          ['sku', 'Product code / SKU'],
          ['name', 'Product name'],
          ['category', 'Category'],
          ['brand', 'Brand'],
          ['ourPrice', 'Your selling price'],
          ['cost', 'Cost to you'],
          ['targetMargin', 'Margin goal (%)'],
          ['stock', 'Stock']
        ].map(([key, label]) => (
          <label key={key} className={`text-sm font-medium text-stone-600 ${key === 'name' ? 'sm:col-span-2' : ''}`}>
            {label}
            <input
              className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 outline-none focus:border-moss"
              value={form[key]}
              type={['ourPrice', 'cost', 'targetMargin', 'stock'].includes(key) ? 'number' : 'text'}
              step={['ourPrice', 'cost'].includes(key) ? '0.01' : '1'}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required
            />
          </label>
        ))}
        <label className="text-sm font-medium text-stone-600">
          Channel
          <select className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 outline-none focus:border-moss" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
            <option>Marketplace</option>
            <option>D2C</option>
            <option>Retail</option>
          </select>
        </label>
        <label className="text-sm font-medium text-stone-600">
          Status
          <select className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 outline-none focus:border-moss" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="healthy">Healthy</option>
            <option value="watch">Watch</option>
            <option value="action">Action</option>
            <option value="opportunity">Opportunity</option>
          </select>
        </label>
        <button className="sm:col-span-2 h-11 rounded-lg bg-ink text-sm font-semibold text-white hover:bg-moss" type="submit">
          Save product
        </button>
      </form>
    </Modal>
  );
}

function PriceModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({ retailer: '', price: '', availability: 'In stock', rating: 4.5 });

  const submit = (event) => {
    event.preventDefault();
    onSave(product.id, {
      ...form,
      price: Number(form.price),
      rating: Number(form.rating)
    });
  };

  return (
    <Modal title={`Add competitor price for ${product.sku}`} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-stone-600">
          Retailer
          <input className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 outline-none focus:border-moss" value={form.retailer} onChange={(e) => setForm({ ...form, retailer: e.target.value })} required />
        </label>
        <label className="text-sm font-medium text-stone-600">
          Price
          <input className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 outline-none focus:border-moss" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        </label>
        <label className="text-sm font-medium text-stone-600">
          Availability
          <select className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 outline-none focus:border-moss" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })}>
            <option>In stock</option>
            <option>Limited</option>
            <option>Backorder</option>
            <option>Out of stock</option>
          </select>
        </label>
        <label className="text-sm font-medium text-stone-600">
          Rating
          <input className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 outline-none focus:border-moss" type="number" step="0.1" max="5" min="0" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
        </label>
        <button className="sm:col-span-2 h-11 rounded-lg bg-ink text-sm font-semibold text-white hover:bg-moss" type="submit">
          Record price
        </button>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <section className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button type="button" title="Close" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(() => {
    const user = localStorage.getItem('pricepulse_user');
    return user ? { user: JSON.parse(user) } : null;
  });
  const [view, setView] = useState('dashboard');
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [products, setProducts] = useState(emptyProducts);
  const [alerts, setAlerts] = useState([]);
  const [system, setSystem] = useState({ api: 'loading', database: 'checking', cache: 'checking' });
  const [users, setUsers] = useState([]);
  const [report, setReport] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(false);
  const [modal, setModal] = useState(null);
  const [message, setMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const canManageProducts = ['admin', 'analyst', 'client'].includes(session?.user?.role);
  const isAdmin = session?.user?.role === 'admin';
  const isClient = session?.user?.role === 'client';

  const handleSession = (nextSession) => {
    localStorage.removeItem('pricepulse_token');
    localStorage.setItem('pricepulse_user', JSON.stringify(nextSession.user));
    setSession({ user: nextSession.user });
  };

  const logout = () => {
    api.logout().catch(() => {});
    localStorage.removeItem('pricepulse_token');
    localStorage.removeItem('pricepulse_user');
    setSession(null);
  };

  const loadData = async () => {
    if (!session) {
      return;
    }

    setLoading(true);
    try {
      const [dashboardData, productData, alertData, systemData] = await Promise.all([
        api.getDashboard(),
        api.getProducts({ search: query, status, category }),
        api.getAlerts(),
        api.getSystem()
      ]);
      setDashboard(dashboardData);
      setProducts(productData);
      setAlerts(alertData);
      setSystem(systemData);
      setLastUpdated(new Date());
      setMessage('');
    } catch (error) {
      if (error.message.includes('401')) {
        logout();
      } else {
        setDashboard(emptyDashboard);
        setProducts(emptyProducts);
        setSystem({ api: 'unavailable', database: 'unavailable', cache: 'unknown' });
        setMessage('We could not load your workspace right now. Please refresh in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    if (!isAdmin) {
      return;
    }

    try {
      setUsers(await api.getUsers());
    } catch (error) {
      setUsers([]);
    }
  };

  const loadReport = async () => {
    try {
      setReport(await api.getReport());
    } catch (error) {
      setMessage('Report is not available right now.');
    }
  };

  useEffect(() => {
    loadData();
  }, [session, query, status, category]);

  useEffect(() => {
    if (view === 'admin') {
      loadAdminData();
    }
    if (view === 'reports') {
      loadReport();
    }
  }, [view, session]);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    const socket = io(socketBaseUrl, { transports: ['websocket', 'polling'] });
    socket.on('connect', () => setLive(true));
    socket.on('disconnect', () => setLive(false));
    socket.on('price:updated', () => loadData());
    socket.on('product:updated', () => loadData());
    socket.on('product:deleted', () => loadData());

    return () => socket.disconnect();
  }, [session]);

  const filteredProducts = useMemo(() => products.items || [], [products]);
  const categories = products.categories || [];
  const topOpportunity = dashboard.opportunities?.[0];

  const saveProduct = async (payload, existingProduct) => {
    try {
      if (existingProduct) {
        await api.updateProduct(existingProduct.id, payload);
        setModal(null);
        setMessage('Product saved successfully.');
      } else {
        const product = await api.createProduct(payload);
        setModal({ type: 'price', product });
        setMessage('Product added. Add one competitor price next so PricePulse can create recommendations.');
      }
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete ${product.sku}?`)) {
      return;
    }
    try {
      await api.deleteProduct(product.id);
      setMessage('Product deleted successfully.');
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const addPrice = async (productId, payload) => {
    try {
      await api.addPrice(productId, payload);
      setModal(null);
      setMessage('Competitor price recorded.');
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const updateAlert = async (alertId, nextStatus) => {
    try {
      setAlerts(await api.updateAlert(alertId, { status: nextStatus }));
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const updateProfile = async (payload) => {
    try {
      const user = await api.updateProfile(payload);
      const nextSession = { ...session, user };
      localStorage.setItem('pricepulse_user', JSON.stringify(user));
      setSession(nextSession);
      setMessage('Settings saved successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const exportReport = (format = 'json') => {
    const source = report || dashboard;
    const isCsv = format === 'csv';
    const rows = source.recommendations || dashboard.opportunities || [];
    const payload = isCsv
      ? [
          'SKU,Product,Action,Current Price,Suggested Price,Competitor,Spread Percent,Confidence',
          ...rows.map((item) => [
            item.sku,
            `"${item.name}"`,
            item.action,
            item.ourPrice,
            item.suggestedPrice,
            item.lowestCompetitor?.retailer || '',
            item.spreadPercent,
            item.confidence
          ].join(','))
        ].join('\n')
      : JSON.stringify(source, null, 2);
    const blob = new Blob([payload], { type: isCsv ? 'text/csv' : 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pricepulse-report-${Date.now()}.${isCsv ? 'csv' : 'json'}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (!session) {
    return <LoginScreen onLogin={handleSession} />;
  }

  const navItems = isClient
    ? [
        { id: 'dashboard', icon: Gauge, label: 'My Overview' },
        { id: 'products', icon: ShoppingBasket, label: 'My Products' },
        { id: 'recommendations', icon: TrendingUp, label: 'Recommendations' },
        { id: 'alerts', icon: Bell, label: 'Alerts' },
        { id: 'reports', icon: FileText, label: 'Reports' },
        { id: 'settings', icon: Settings, label: 'Settings' },
        { id: 'help', icon: BookOpen, label: 'Help' }
      ]
    : [
        { id: 'dashboard', icon: Gauge, label: 'Command Center', roles: ['admin', 'analyst'] },
        { id: 'products', icon: ShoppingBasket, label: 'Products', roles: ['admin', 'analyst'] },
        { id: 'trends', icon: LineIcon, label: 'Market Trends', roles: ['admin', 'analyst'] },
        { id: 'alerts', icon: ShieldCheck, label: 'Alerts', roles: ['admin', 'analyst'] },
        { id: 'reports', icon: BriefcaseBusiness, label: 'Reports', roles: ['admin', 'analyst'] },
        { id: 'admin', icon: Users, label: 'Admin', roles: ['admin'] },
        { id: 'infrastructure', icon: Database, label: 'Infrastructure', roles: ['admin', 'analyst'] }
      ].filter((item) => item.roles.includes(session.user.role));

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-ink">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-stone-200 bg-[#17211b] px-5 py-6 text-white lg:block">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-mint p-2 text-moss">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">PricePulse</p>
              <p className="text-sm text-white/60">Intelligence</p>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            {navItems.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium ${view === item.id ? 'bg-white text-ink' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>

          {!isClient && (
          <div className="mt-10 rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Server className="h-4 w-4 text-honey" />
              Runtime
            </div>
            <div className="mt-4 space-y-3 text-sm text-white/70">
              <div className="flex items-center justify-between"><span>API</span><span className="font-medium text-white">{system.api}</span></div>
              <div className="flex items-center justify-between"><span>PostgreSQL</span><span className="font-medium text-white">{system.database}</span></div>
              <div className="flex items-center justify-between"><span>Redis</span><span className="font-medium text-white">{system.cache}</span></div>
            </div>
          </div>
          )}
        </aside>

        <section className="flex-1 overflow-hidden">
          <header className="border-b border-stone-200 bg-white/80 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-moss">{session.user.role} workspace</p>
                <h1 className="mt-1 text-2xl font-semibold text-ink md:text-3xl">{viewTitle(view, session.user.role)}</h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-600">
                  <span className={`status-dot ${live ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  {live ? 'Live' : 'Syncing'}
                </div>
                <button type="button" title="Refresh" onClick={loadData} className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:border-moss hover:text-moss">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                {canManageProducts && (
                  <button type="button" title="Add product" onClick={() => setModal({ type: 'product' })} className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white hover:bg-moss">
                    <PackagePlus className="h-4 w-4" />
                  </button>
                )}
                <div className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
                  <p className="font-semibold">{session.user.name}</p>
                  <p className="text-xs capitalize text-stone-500">{session.user.role}</p>
                </div>
                <button type="button" title="Sign out" onClick={logout} className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:border-rose-300 hover:text-rose-600">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <div className="h-[calc(100vh-89px)] overflow-y-auto px-4 py-6 md:px-8">
            {message && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</div>}
            {view === 'dashboard' && (isClient
              ? <ClientDashboardView dashboard={dashboard} products={products} alerts={alerts} setView={setView} onAddProduct={() => setModal({ type: 'product' })} />
              : <DashboardView dashboard={dashboard} lastUpdated={lastUpdated} topOpportunity={topOpportunity} />)}
            {view === 'products' && (
              <ProductsView
                products={products}
                filteredProducts={filteredProducts}
                categories={categories}
                query={query}
                status={status}
                category={category}
                setQuery={setQuery}
                setStatus={setStatus}
                setCategory={setCategory}
                canManageProducts={canManageProducts}
                isAdmin={isAdmin}
                onAddProduct={() => setModal({ type: 'product' })}
                onEdit={(product) => setModal({ type: 'product', product })}
                onPrice={(product) => setModal({ type: 'price', product })}
                onDetails={(product) => setModal({ type: 'detail', product })}
                onDelete={deleteProduct}
              />
            )}
            {view === 'trends' && <TrendsView dashboard={dashboard} />}
            {view === 'recommendations' && <RecommendationsPage opportunities={dashboard.opportunities} setView={setView} />}
            {view === 'alerts' && <AlertsView alerts={alerts} canManageProducts={canManageProducts} updateAlert={updateAlert} />}
            {view === 'reports' && <ReportsView report={report} dashboard={dashboard} exportReport={exportReport} loadReport={loadReport} />}
            {view === 'settings' && <SettingsView user={session.user} updateProfile={updateProfile} />}
            {view === 'help' && <HelpView />}
            {view === 'admin' && <AdminView users={users} products={products} />}
            {view === 'infrastructure' && <InfrastructureView system={system} />}
          </div>
        </section>
      </div>

      {modal?.type === 'product' && <ProductModal product={modal.product} onClose={() => setModal(null)} onSave={saveProduct} />}
      {modal?.type === 'price' && <PriceModal product={modal.product} onClose={() => setModal(null)} onSave={addPrice} />}
      {modal?.type === 'detail' && <ProductDetailModal product={modal.product} onClose={() => setModal(null)} />}
    </main>
  );
}

function viewTitle(view, role) {
  const clientTitles = {
    dashboard: 'Your pricing health at a glance',
    products: 'Your tracked products',
    recommendations: 'Actions recommended for you',
    alerts: 'Important price alerts',
    reports: 'Business reports and downloads',
    settings: 'Profile and notification settings',
    help: 'How to use PricePulse'
  };
  const teamTitles = {
    dashboard: 'Revenue, margin, and competitor moves',
    products: 'Product catalog and competitor observations',
    trends: 'Market trends and category performance',
    alerts: 'Alert triage and pricing risk queue',
    reports: 'Executive reports and exports',
    admin: 'Admin console',
    infrastructure: 'Infrastructure and deployment health'
  };
  const titles = role === 'client' ? clientTitles : teamTitles;
  return titles[view] || titles.dashboard;
}

function DashboardView({ dashboard, lastUpdated, topOpportunity }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Boxes} label="Tracked products" value={number.format(dashboard.stats.trackedProducts)} detail={`${number.format(dashboard.stats.competitors)} competitors monitored`} tone="bg-mint text-moss" />
        <MetricCard icon={CircleDollarSign} label="Average margin" value={`${dashboard.stats.averageMargin}%`} detail={`${dashboard.stats.priceChanges24h} market moves in 24h`} tone="bg-amber-100 text-amber-700" />
        <MetricCard icon={AlertTriangle} label="At-risk SKUs" value={number.format(dashboard.stats.atRiskSkus)} detail={`${dashboard.stats.activeAlerts} active alerts`} tone="bg-rose-100 text-rose-700" />
        <MetricCard icon={TrendingUp} label="Best action" value={topOpportunity?.action || 'Hold band'} detail={topOpportunity?.sku || 'No urgent move'} tone="bg-indigo-100 text-indigo-700" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <MarketChart dashboard={dashboard} lastUpdated={lastUpdated} />
        <CategoryChart dashboard={dashboard} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Recommendations opportunities={dashboard.opportunities} />
        <AlertCards alerts={dashboard.alerts} />
      </div>
    </>
  );
}

function ClientDashboardView({ dashboard, products, alerts, setView, onAddProduct }) {
  const riskyProducts = (products.items || []).filter((product) => ['watch', 'action'].includes(product.status));
  const opportunities = dashboard.opportunities || [];
  const topAction = opportunities[0];

  if ((products.items || []).length === 0) {
    return (
      <div className="space-y-6">
        <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase text-moss">Welcome to your workspace</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">Start with one product you sell.</h2>
          <p className="mt-3 max-w-2xl text-stone-600">
            Add a product, then add at least one competitor price. PricePulse will turn that into margin, spread, alerts, and recommendations.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={onAddProduct} className="flex h-11 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-moss">
              <PackagePlus className="h-4 w-4" />
              Add first product
            </button>
            <button type="button" onClick={() => setView('help')} className="h-11 rounded-lg border border-stone-200 px-4 text-sm font-semibold hover:border-moss hover:text-moss">
              See how it works
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ['1', 'Add your product', 'Name, SKU, price, cost, and stock.'],
            ['2', 'Add competitor price', 'Amazon, Walmart, Flipkart, or any channel you track.'],
            ['3', 'Use recommendations', 'Protect rank, lift margin, or hold steady.']
          ].map(([step, title, detail]) => (
            <div key={step} className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint text-sm font-semibold text-moss">{step}</div>
              <p className="mt-4 font-semibold">{title}</p>
              <p className="mt-1 text-sm text-stone-500">{detail}</p>
            </div>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-moss">Client summary</p>
            <h2 className="mt-2 text-3xl font-semibold text-ink">Your store has {riskyProducts.length} products that need attention.</h2>
            <p className="mt-3 max-w-2xl text-stone-600">
              PricePulse watches competitor movement, margin pressure, and pricing opportunities so you can decide what to protect, hold, or improve next.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard icon={AlertTriangle} label="Needs attention" value={riskyProducts.length} detail="products losing position or margin" tone="bg-rose-100 text-rose-700" />
            <MetricCard icon={TrendingUp} label="Best next move" value={topAction?.action || 'Hold'} detail={topAction?.sku || 'No urgent action'} tone="bg-indigo-100 text-indigo-700" />
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={Boxes} label="Products monitored" value={number.format(dashboard.stats.trackedProducts)} detail={`${dashboard.stats.competitors} competitor channels`} tone="bg-mint text-moss" />
        <MetricCard icon={CircleDollarSign} label="Average margin" value={`${dashboard.stats.averageMargin}%`} detail="across your catalog" tone="bg-amber-100 text-amber-700" />
        <MetricCard icon={Bell} label="Active alerts" value={dashboard.stats.activeAlerts} detail="items waiting for review" tone="bg-rose-100 text-rose-700" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">What to do next</h2>
              <p className="text-sm text-stone-500">The most important actions for your business.</p>
            </div>
            <button type="button" onClick={() => setView('recommendations')} className="h-10 rounded-lg border border-stone-200 px-3 text-sm font-semibold hover:border-moss hover:text-moss">
              View all
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {opportunities.slice(0, 3).map((item) => (
              <div key={item.productId} className="rounded-lg border border-stone-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-stone-500">{item.sku} is compared against {item.lowestCompetitor.retailer}</p>
                  </div>
                  <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-moss">{item.confidence}% confidence</span>
                </div>
                <p className="mt-3 text-sm text-stone-600">
                  Suggested action: <span className="font-semibold text-ink">{item.action}</span>. Move from {money.format(item.ourPrice)} toward {money.format(item.suggestedPrice)}.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Latest alerts</h2>
              <p className="text-sm text-stone-500">Plain-language risk notes.</p>
            </div>
            <button type="button" onClick={() => setView('alerts')} className="h-10 rounded-lg border border-stone-200 px-3 text-sm font-semibold hover:border-moss hover:text-moss">
              Open alerts
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {(alerts.length ? alerts : dashboard.alerts).slice(0, 3).map((alert) => (
              <div key={alert.id} className="rounded-lg border border-stone-200 p-4">
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${severityStyles[alert.severity]}`}>{alert.severity}</span>
                <p className="mt-3 font-semibold">{alert.title}</p>
                <p className="mt-1 text-sm text-stone-500">{alert.message}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ProductDetailModal({ product, onClose }) {
  const history = product.priceHistory || [];
  const competitors = product.competitors || [];

  return (
    <Modal title={product.name} onClose={onClose}>
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <MetricCard icon={ShoppingBasket} label="SKU" value={product.sku} detail={product.category} tone="bg-mint text-moss" />
          <MetricCard icon={CircleDollarSign} label="Our price" value={money.format(product.ourPrice)} detail={`${product.margin}% margin`} tone="bg-amber-100 text-amber-700" />
          <MetricCard icon={TrendingUp} label="Spread" value={`${product.spreadPercent}%`} detail="vs lowest competitor" tone="bg-indigo-100 text-indigo-700" />
          <MetricCard icon={Boxes} label="Stock" value={number.format(product.stock)} detail={product.channel} tone="bg-stone-100 text-stone-700" />
        </div>

        <section className="rounded-lg border border-stone-200 p-4">
          <h3 className="font-semibold">Why this matters</h3>
          <p className="mt-2 text-sm text-stone-600">
            {product.spreadPercent > 6
              ? 'A competitor is materially cheaper. This product may lose search rank, conversion, and revenue unless reviewed.'
              : product.spreadPercent < -6
                ? 'You are priced below the market. There may be room to improve margin without losing competitiveness.'
                : 'Your price is close to the market band. Continue monitoring before making a major change.'}
          </p>
        </section>

        <section className="rounded-lg border border-stone-200 p-4">
          <h3 className="font-semibold">Price trend</h3>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="#e7e2d8" strokeDasharray="4 4" />
                <XAxis dataKey="time" stroke="#78716c" fontSize={11} tickFormatter={(_, index) => `T${index + 1}`} />
                <YAxis stroke="#78716c" fontSize={11} />
                <Tooltip formatter={(value) => money.format(value)} />
                <Line type="monotone" dataKey="ourPrice" stroke="#2f6f4e" strokeWidth={3} dot={false} name="Our price" />
                <Line type="monotone" dataKey="marketPrice" stroke="#f9735b" strokeWidth={3} dot={false} name="Market" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-stone-200 p-4">
          <h3 className="font-semibold">Competitors</h3>
          {competitors.length === 0 && (
            <p className="mt-2 text-sm text-stone-500">No competitor prices yet. Add one from My Products to unlock recommendations.</p>
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {competitors.map((competitor) => (
              <div key={competitor.retailer} className="rounded-lg bg-stone-50 p-3">
                <p className="font-semibold">{competitor.retailer}</p>
                <p className="mt-1 text-lg font-semibold">{money.format(competitor.price)}</p>
                <p className="text-xs text-stone-500">{competitor.availability} / rating {competitor.rating}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}

function MarketChart({ dashboard, lastUpdated }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-ink">Market index</h2><p className="text-sm text-stone-500">Last sync {lastUpdated.toLocaleTimeString()}</p></div>
        <div className="rounded-lg bg-stone-100 p-2 text-stone-600"><Activity className="h-5 w-5" /></div>
      </div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dashboard.trend} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="#e7e2d8" strokeDasharray="4 4" />
            <XAxis dataKey="label" stroke="#78716c" fontSize={12} />
            <YAxis stroke="#78716c" fontSize={12} />
            <Tooltip formatter={(value) => money.format(value)} />
            <Line type="monotone" dataKey="ourIndex" stroke="#2f6f4e" strokeWidth={3} dot={false} name="Our price" />
            <Line type="monotone" dataKey="marketIndex" stroke="#f9735b" strokeWidth={3} dot={false} name="Market" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function CategoryChart({ dashboard }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-ink">Category spread</h2><p className="text-sm text-stone-500">Positive spread needs attention</p></div>
        <div className="rounded-lg bg-stone-100 p-2 text-stone-600"><BarChart3 className="h-5 w-5" /></div>
      </div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dashboard.categoryPerformance} layout="vertical" margin={{ top: 8, right: 12, left: 28, bottom: 0 }}>
            <CartesianGrid stroke="#e7e2d8" strokeDasharray="4 4" />
            <XAxis type="number" stroke="#78716c" fontSize={12} />
            <YAxis dataKey="category" type="category" stroke="#78716c" fontSize={12} width={86} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Bar dataKey="avgSpread" fill="#6d5dfc" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function ProductsView(props) {
  const {
    products,
    filteredProducts,
    categories,
    query,
    status,
    category,
    setQuery,
    setStatus,
    setCategory,
    canManageProducts,
    onAddProduct,
    onDetails,
    onEdit,
    onPrice,
    onDelete
  } = props;

  return (
    <section className="rounded-lg border border-stone-200 bg-white shadow-soft">
      <div className="flex flex-col gap-4 border-b border-stone-200 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h2 className="text-lg font-semibold text-ink">Product intelligence</h2><p className="text-sm text-stone-500">{products.total} SKUs tracked across live channels</p></div>
        <div className="flex flex-wrap gap-2">
          <div className="flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3">
            <Search className="h-4 w-4 text-stone-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search SKU" className="w-36 border-0 bg-transparent text-sm outline-none" />
          </div>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none">
            <option value="">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none">
            <option value="">All status</option>
            <option value="healthy">Healthy</option>
            <option value="watch">Watch</option>
            <option value="action">Action</option>
            <option value="opportunity">Opportunity</option>
          </select>
          {canManageProducts && (
            <button type="button" onClick={onAddProduct} className="flex h-10 items-center gap-2 rounded-lg bg-ink px-3 text-sm font-semibold text-white hover:bg-moss">
              <PackagePlus className="h-4 w-4" />
              Add product
            </button>
          )}
        </div>
      </div>
      {filteredProducts.length === 0 && (
        <div className="p-8">
          <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
            <ShoppingBasket className="mx-auto h-8 w-8 text-stone-400" />
            <h3 className="mt-3 text-lg font-semibold text-ink">No products yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
              Add one product and one competitor price. Your dashboard, recommendations, alerts, and reports will update automatically.
            </p>
            {canManageProducts && (
              <button type="button" onClick={onAddProduct} className="mt-4 h-10 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-moss">
                Add first product
              </button>
            )}
          </div>
        </div>
      )}
      {filteredProducts.length > 0 && (
      <div className="scrollbar-thin overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              {['Product', 'Channel', 'Our price', 'Lowest competitor', 'Spread', 'Margin', 'Status', 'Actions'].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-stone-50">
                <td className="px-4 py-4"><div className="font-semibold text-ink">{product.name}</div><div className="text-xs text-stone-500">{product.sku} / {product.category}</div></td>
                <td className="px-4 py-4 text-stone-600">{product.channel}</td>
                <td className="px-4 py-4 font-semibold">{money.format(product.ourPrice)}</td>
                <td className="px-4 py-4"><div className="font-medium">{product.lowestCompetitor?.retailer || 'None'}</div><div className="text-xs text-stone-500">{product.lowestCompetitor ? money.format(product.lowestCompetitor.price) : '-'}</div></td>
                <td className={`px-4 py-4 font-semibold ${product.spreadPercent > 6 ? 'text-rose-600' : product.spreadPercent < -6 ? 'text-emerald-700' : 'text-stone-700'}`}>{product.spreadPercent}%</td>
                <td className="px-4 py-4">{product.margin}%</td>
                <td className="px-4 py-4"><StatusBadge status={product.status} /></td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <button title="View details" type="button" onClick={() => onDetails(product)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 hover:border-moss hover:text-moss"><Eye className="h-4 w-4" /></button>
                    {canManageProducts && <button title="Add price" type="button" onClick={() => onPrice(product)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 hover:border-moss hover:text-moss"><CircleDollarSign className="h-4 w-4" /></button>}
                    {canManageProducts && <button title="Edit" type="button" onClick={() => onEdit(product)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 hover:border-moss hover:text-moss"><Pencil className="h-4 w-4" /></button>}
                    {canManageProducts && <button title="Delete" type="button" onClick={() => onDelete(product)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 hover:border-rose-300 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </section>
  );
}

function Recommendations({ opportunities = [] }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white shadow-soft">
      <div className="border-b border-stone-200 p-4"><h2 className="text-lg font-semibold text-ink">Recommended moves</h2><p className="text-sm text-stone-500">Ranked by spread intensity</p></div>
      {opportunities.length === 0 && (
        <div className="p-5 text-sm text-stone-500">
          Add competitor prices to unlock plain-language recommendations.
        </div>
      )}
      <div className="divide-y divide-stone-100">
        {opportunities.map((item) => (
          <div key={item.productId} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-semibold text-ink">{item.name}</p><p className="text-sm text-stone-500">{item.sku} / {item.lowestCompetitor.retailer}</p></div>
              <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-moss">{item.confidence}%</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div><p className="text-stone-500">Now</p><p className="font-semibold">{money.format(item.ourPrice)}</p></div>
              <div><p className="text-stone-500">Target</p><p className="font-semibold">{money.format(item.suggestedPrice)}</p></div>
              <div><p className="text-stone-500">Action</p><p className="font-semibold">{item.action}</p></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecommendationsPage({ opportunities = [], setView }) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
        <p className="text-sm font-semibold uppercase text-moss">Recommended actions</p>
        <h2 className="mt-2 text-2xl font-semibold">Clear next steps, written for business decisions.</h2>
        <p className="mt-2 max-w-3xl text-stone-600">
          Each recommendation compares your price against the lowest competitor and protects either sales rank, margin, or market position.
        </p>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        {opportunities.length === 0 && (
          <section className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-center shadow-soft lg:col-span-2">
            <TrendingUp className="mx-auto h-8 w-8 text-stone-400" />
            <h3 className="mt-3 text-lg font-semibold">No recommendations yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
              Add one competitor price from My Products. PricePulse will calculate spread, margin pressure, and the next best action.
            </p>
            <button type="button" onClick={() => setView('products')} className="mt-4 h-10 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-moss">
              Go to products
            </button>
          </section>
        )}
        {opportunities.map((item) => (
          <section key={item.productId} className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-500">{item.sku} / {item.category}</p>
                <h3 className="mt-1 text-lg font-semibold">{item.name}</h3>
              </div>
              <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-moss">{item.confidence}%</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-stone-50 p-3 text-sm">
              <div><p className="text-stone-500">Current</p><p className="font-semibold">{money.format(item.ourPrice)}</p></div>
              <div><p className="text-stone-500">Suggested</p><p className="font-semibold">{money.format(item.suggestedPrice)}</p></div>
              <div><p className="text-stone-500">Competitor</p><p className="font-semibold">{money.format(item.lowestCompetitor.price)}</p></div>
            </div>
            <p className="mt-4 text-sm text-stone-600">
              <span className="font-semibold text-ink">{item.action}</span> because the market spread is {item.spreadPercent}% against {item.lowestCompetitor.retailer}.
            </p>
            <button type="button" onClick={() => setView('reports')} className="mt-4 h-10 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-moss">
              Include in report
            </button>
          </section>
        ))}
      </div>
    </div>
  );
}

function AlertCards({ alerts = [] }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white shadow-soft">
      <div className="border-b border-stone-200 p-4"><h2 className="text-lg font-semibold text-ink">Alert queue</h2><p className="text-sm text-stone-500">Open competitive events</p></div>
      {alerts.length === 0 && (
        <div className="p-5 text-sm text-stone-500">
          No urgent alerts right now.
        </div>
      )}
      <div className="divide-y divide-stone-100">
        {alerts.map((alert) => (
          <div key={alert.id} className="p-4">
            <div className="flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${severityStyles[alert.severity]}`}>{alert.severity}</span><span className="text-xs font-medium uppercase text-stone-400">{alert.status}</span></div>
            <p className="mt-3 font-semibold text-ink">{alert.title}</p>
            <p className="mt-1 text-sm text-stone-500">{alert.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrendsView({ dashboard }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
      <MarketChart dashboard={dashboard} lastUpdated={new Date(dashboard.generatedAt || Date.now())} />
      <CategoryChart dashboard={dashboard} />
      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft xl:col-span-2">
        <h2 className="text-lg font-semibold text-ink">Category performance table</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {dashboard.categoryPerformance.map((item) => (
            <div key={item.category} className="rounded-lg border border-stone-200 p-4">
              <p className="font-semibold">{item.category}</p>
              <p className="mt-2 text-sm text-stone-500">{item.products} products</p>
              <p className="mt-3 text-sm">Avg spread <span className="font-semibold">{item.avgSpread}%</span></p>
              <p className="text-sm">Avg margin <span className="font-semibold">{item.avgMargin}%</span></p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AlertsView({ alerts = [], canManageProducts, updateAlert }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white shadow-soft">
      <div className="border-b border-stone-200 p-4"><h2 className="text-lg font-semibold">Alert triage</h2><p className="text-sm text-stone-500">Move alerts from open to investigating or closed.</p></div>
      {alerts.length === 0 && (
        <div className="p-8 text-center">
          <Bell className="mx-auto h-8 w-8 text-stone-400" />
          <h3 className="mt-3 text-lg font-semibold">No alerts yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
            Alerts appear when competitor prices create a risk or margin opportunity.
          </p>
        </div>
      )}
      <div className="divide-y divide-stone-100">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${severityStyles[alert.severity]}`}>{alert.severity}</span><span className="text-xs font-semibold uppercase text-stone-400">{alert.status}</span></div>
              <p className="mt-2 font-semibold">{alert.title}</p>
              <p className="mt-1 text-sm text-stone-500">{alert.message}</p>
            </div>
            {canManageProducts && (
              <div className="flex gap-2">
                {['open', 'investigating', 'closed'].map((item) => (
                  <button key={item} type="button" onClick={() => updateAlert(alert.id, item)} className="h-9 rounded-lg border border-stone-200 px-3 text-sm capitalize hover:border-moss hover:text-moss">{item}</button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ReportsView({ report, dashboard, exportReport, loadReport }) {
  const summary = report?.executiveSummary;
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div><h2 className="text-lg font-semibold">Executive report</h2><p className="text-sm text-stone-500">Shareable business summary</p></div>
          <div className="flex gap-2">
            <button type="button" onClick={loadReport} className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200"><RefreshCw className="h-4 w-4" /></button>
            <button type="button" onClick={() => exportReport('csv')} className="h-10 rounded-lg border border-stone-200 px-3 text-sm font-semibold hover:border-moss hover:text-moss">CSV</button>
            <button type="button" onClick={() => window.print()} className="h-10 rounded-lg border border-stone-200 px-3 text-sm font-semibold hover:border-moss hover:text-moss">Print</button>
            <button type="button" onClick={() => exportReport('json')} className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white"><Download className="h-4 w-4" /></button>
          </div>
        </div>
        <p className="mt-5 text-2xl font-semibold">{summary?.headline || 'Report loading'}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetricCard icon={Boxes} label="Products" value={summary?.trackedProducts || dashboard.stats.trackedProducts} detail="tracked SKUs" tone="bg-mint text-moss" />
          <MetricCard icon={AlertTriangle} label="Alerts" value={summary?.activeAlerts || dashboard.stats.activeAlerts} detail="active items" tone="bg-rose-100 text-rose-700" />
          <MetricCard icon={CircleDollarSign} label="Margin" value={`${summary?.averageMargin || dashboard.stats.averageMargin}%`} detail="average margin" tone="bg-amber-100 text-amber-700" />
        </div>
      </section>
      <Recommendations opportunities={report?.recommendations || dashboard.opportunities} />
    </div>
  );
}

function SettingsView({ user, updateProfile }) {
  const [form, setForm] = useState({
    name: user.name,
    company: user.company,
    preferences: {
      weeklyDigest: Boolean(user.preferences?.weeklyDigest),
      criticalAlerts: Boolean(user.preferences?.criticalAlerts),
      reportFormat: user.preferences?.reportFormat || 'pdf'
    }
  });

  const submit = (event) => {
    event.preventDefault();
    updateProfile(form);
  };

  return (
    <section className="max-w-3xl rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Client settings</p>
        <h2 className="mt-2 text-2xl font-semibold">Profile and notifications</h2>
        <p className="mt-2 text-sm text-stone-500">Control how your business reports and urgent price alerts should behave.</p>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-stone-600">
            Name
            <input className="mt-1 h-11 w-full rounded-lg border border-stone-200 px-3 outline-none focus:border-moss" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="text-sm font-medium text-stone-600">
            Company
            <input className="mt-1 h-11 w-full rounded-lg border border-stone-200 px-3 outline-none focus:border-moss" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </label>
        </div>
        <div className="rounded-lg border border-stone-200 p-4">
          <p className="font-semibold">Notification preferences</p>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>Send weekly pricing digest</span>
              <input type="checkbox" checked={form.preferences.weeklyDigest} onChange={(e) => setForm({ ...form, preferences: { ...form.preferences, weeklyDigest: e.target.checked } })} />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm">
              <span>Notify for critical competitor undercuts</span>
              <input type="checkbox" checked={form.preferences.criticalAlerts} onChange={(e) => setForm({ ...form, preferences: { ...form.preferences, criticalAlerts: e.target.checked } })} />
            </label>
            <label className="block text-sm font-medium text-stone-600">
              Preferred report format
              <select className="mt-1 h-10 w-full rounded-lg border border-stone-200 px-3 outline-none focus:border-moss" value={form.preferences.reportFormat} onChange={(e) => setForm({ ...form, preferences: { ...form.preferences, reportFormat: e.target.value } })}>
                <option value="pdf">PDF summary</option>
                <option value="csv">CSV data</option>
                <option value="json">JSON export</option>
              </select>
            </label>
          </div>
        </div>
        <button type="submit" className="h-11 rounded-lg bg-ink px-5 text-sm font-semibold text-white hover:bg-moss">
          Save settings
        </button>
      </form>
    </section>
  );
}

function HelpView() {
  const steps = [
    ['Check Overview', 'Start with products needing attention and the best next move.'],
    ['Open Product Detail', 'Review competitors, price history, margin, and the reason behind the recommendation.'],
    ['Review Recommendations', 'Use Protect rank, Lift margin, or Hold band to guide business action.'],
    ['Download Report', 'Export a summary for meetings, approvals, or client sharing.']
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
        <p className="text-sm font-semibold uppercase text-moss">Help</p>
        <h2 className="mt-2 text-2xl font-semibold">How clients use PricePulse</h2>
        <p className="mt-3 text-stone-600">
          PricePulse turns competitor pricing into plain actions. You do not need to manage technical systems to use it.
        </p>
      </section>
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft">
        <div className="space-y-4">
          {steps.map(([title, detail], index) => (
            <div key={title} className="flex gap-4 rounded-lg border border-stone-200 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mint text-sm font-semibold text-moss">{index + 1}</div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm text-stone-500">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AdminView({ users, products }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <section className="rounded-lg border border-stone-200 bg-white shadow-soft">
        <div className="border-b border-stone-200 p-4"><h2 className="text-lg font-semibold">Users and roles</h2><p className="text-sm text-stone-500">Admin, analyst, and client access.</p></div>
        <div className="divide-y divide-stone-100">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4">
              <div><p className="font-semibold">{user.name}</p><p className="text-sm text-stone-500">{user.email}</p></div>
              <div className="text-right"><p className="text-sm font-semibold capitalize">{user.role}</p><p className="text-xs text-stone-500">{user.company}</p></div>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
        <h2 className="text-lg font-semibold">Admin checklist</h2>
        <div className="mt-4 space-y-3">
          {[
            'Create user accounts by role',
            'Add products and price observations',
            'Review alerts daily',
            'Export executive report',
            'Deploy with Docker and AWS secrets'
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-moss" />
              {item}
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-stone-500">{products.total} products are currently visible to this workspace.</p>
      </section>
    </div>
  );
}

function InfrastructureView({ system }) {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {[
        ['API', system.api, Server],
        ['PostgreSQL', system.database, Database],
        ['Redis', system.cache, Activity]
      ].map(([label, value, Icon]) => (
        <section key={label} className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
          <Icon className="h-5 w-5 text-moss" />
          <p className="mt-4 text-sm text-stone-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold capitalize">{value}</p>
        </section>
      ))}
      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft xl:col-span-3">
        <div className="flex items-center gap-2"><Settings className="h-5 w-5 text-stone-500" /><h2 className="text-lg font-semibold">Deployment path</h2></div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {['GitHub Actions validates code', 'Docker builds API and UI', 'Nginx serves app traffic', 'AWS EC2/RDS/Redis hosts production'].map((item) => (
            <div key={item} className="rounded-lg border border-stone-200 p-4 text-sm text-stone-600">{item}</div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
