import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  CircleDollarSign,
  Database,
  Filter,
  Gauge,
  LineChart as LineIcon,
  PackagePlus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  ShoppingBasket,
  Signal,
  TrendingUp,
  Zap
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
import { fallbackDashboard, fallbackProducts } from './data/fallback';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
});

const number = new Intl.NumberFormat('en-US');

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

function EmptyState() {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50 text-sm text-stone-500">
      No matching products
    </div>
  );
}

function App() {
  const [dashboard, setDashboard] = useState(fallbackDashboard);
  const [products, setProducts] = useState(fallbackProducts);
  const [system, setSystem] = useState({ api: 'loading', database: 'checking', cache: 'checking' });
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardData, productData, systemData] = await Promise.all([
        api.getDashboard(),
        api.getProducts({ search: query, status, category }),
        api.getSystem()
      ]);
      setDashboard(dashboardData);
      setProducts(productData);
      setSystem(systemData);
      setLastUpdated(new Date());
    } catch (error) {
      setDashboard(fallbackDashboard);
      setProducts(fallbackProducts);
      setSystem({ api: 'fallback', database: 'fallback', cache: 'disabled' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [query, status, category]);

  useEffect(() => {
    const socket = io(socketBaseUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => setLive(true));
    socket.on('disconnect', () => setLive(false));
    socket.on('price:updated', () => loadData());

    return () => socket.disconnect();
  }, []);

  const filteredProducts = useMemo(() => products.items || [], [products]);
  const categories = products.categories || [];
  const topOpportunity = dashboard.opportunities?.[0];

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-ink">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-stone-200 bg-[#17211b] px-5 py-6 text-white lg:block">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-mint p-2 text-moss">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">PricePulse</p>
              <p className="text-sm text-white/60">Intelligence</p>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            {[
              { icon: Gauge, label: 'Command Center', active: true },
              { icon: ShoppingBasket, label: 'Products' },
              { icon: LineIcon, label: 'Market Trends' },
              { icon: ShieldCheck, label: 'Alerts' },
              { icon: Database, label: 'Infrastructure' }
            ].map((item) => (
              <button
                type="button"
                key={item.label}
                className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium ${item.active ? 'bg-white text-ink' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-10 rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Server className="h-4 w-4 text-honey" />
              Runtime
            </div>
            <div className="mt-4 space-y-3 text-sm text-white/70">
              <div className="flex items-center justify-between">
                <span>API</span>
                <span className="font-medium text-white">{system.api}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>PostgreSQL</span>
                <span className="font-medium text-white">{system.database}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Redis</span>
                <span className="font-medium text-white">{system.cache}</span>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1 overflow-hidden">
          <header className="border-b border-stone-200 bg-white/80 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-moss">Real-time price intelligence</p>
                <h1 className="mt-1 text-2xl font-semibold text-ink md:text-3xl">Revenue, margin, and competitor moves</h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-600">
                  <span className={`status-dot ${live ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  {live ? 'Live' : 'Syncing'}
                </div>
                <button
                  type="button"
                  title="Refresh"
                  onClick={loadData}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 hover:border-moss hover:text-moss"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  title="Add product"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white hover:bg-moss"
                >
                  <PackagePlus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <div className="h-[calc(100vh-89px)] overflow-y-auto px-4 py-6 md:px-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={Boxes}
                label="Tracked products"
                value={number.format(dashboard.stats.trackedProducts)}
                detail={`${number.format(dashboard.stats.competitors)} competitors monitored`}
                tone="bg-mint text-moss"
              />
              <MetricCard
                icon={CircleDollarSign}
                label="Average margin"
                value={`${dashboard.stats.averageMargin}%`}
                detail={`${dashboard.stats.priceChanges24h} market moves in 24h`}
                tone="bg-amber-100 text-amber-700"
              />
              <MetricCard
                icon={AlertTriangle}
                label="At-risk SKUs"
                value={number.format(dashboard.stats.atRiskSkus)}
                detail={`${dashboard.stats.activeAlerts} active alerts`}
                tone="bg-rose-100 text-rose-700"
              />
              <MetricCard
                icon={TrendingUp}
                label="Best action"
                value={topOpportunity?.action || 'Hold band'}
                detail={topOpportunity?.sku || 'No urgent move'}
                tone="bg-indigo-100 text-indigo-700"
              />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
              <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">Market index</h2>
                    <p className="text-sm text-stone-500">Last sync {lastUpdated.toLocaleTimeString()}</p>
                  </div>
                  <div className="rounded-lg bg-stone-100 p-2 text-stone-600">
                    <Activity className="h-5 w-5" />
                  </div>
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

              <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">Category spread</h2>
                    <p className="text-sm text-stone-500">Positive spread needs attention</p>
                  </div>
                  <div className="rounded-lg bg-stone-100 p-2 text-stone-600">
                    <BarChart3 className="h-5 w-5" />
                  </div>
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
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.85fr]">
              <section className="rounded-lg border border-stone-200 bg-white shadow-soft">
                <div className="flex flex-col gap-4 border-b border-stone-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">Product intelligence</h2>
                    <p className="text-sm text-stone-500">{products.total} SKUs tracked across live channels</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3">
                      <Search className="h-4 w-4 text-stone-400" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search SKU"
                        className="w-36 border-0 bg-transparent text-sm outline-none"
                      />
                    </div>
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none"
                    >
                      <option value="">All categories</option>
                      {categories.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    <select
                      value={status}
                      onChange={(event) => setStatus(event.target.value)}
                      className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none"
                    >
                      <option value="">All status</option>
                      <option value="healthy">Healthy</option>
                      <option value="watch">Watch</option>
                      <option value="action">Action</option>
                      <option value="opportunity">Opportunity</option>
                    </select>
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="p-4">
                    <EmptyState />
                  </div>
                ) : (
                  <div className="scrollbar-thin overflow-x-auto">
                    <table className="min-w-[840px] w-full border-collapse text-left text-sm">
                      <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Product</th>
                          <th className="px-4 py-3 font-semibold">Channel</th>
                          <th className="px-4 py-3 font-semibold">Our price</th>
                          <th className="px-4 py-3 font-semibold">Lowest competitor</th>
                          <th className="px-4 py-3 font-semibold">Spread</th>
                          <th className="px-4 py-3 font-semibold">Margin</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-stone-50">
                            <td className="px-4 py-4">
                              <div className="font-semibold text-ink">{product.name}</div>
                              <div className="text-xs text-stone-500">{product.sku} / {product.category}</div>
                            </td>
                            <td className="px-4 py-4 text-stone-600">{product.channel}</td>
                            <td className="px-4 py-4 font-semibold">{money.format(product.ourPrice)}</td>
                            <td className="px-4 py-4">
                              <div className="font-medium">{product.lowestCompetitor?.retailer || 'None'}</div>
                              <div className="text-xs text-stone-500">{product.lowestCompetitor ? money.format(product.lowestCompetitor.price) : '-'}</div>
                            </td>
                            <td className={`px-4 py-4 font-semibold ${product.spreadPercent > 6 ? 'text-rose-600' : product.spreadPercent < -6 ? 'text-emerald-700' : 'text-stone-700'}`}>
                              {product.spreadPercent}%
                            </td>
                            <td className="px-4 py-4">{product.margin}%</td>
                            <td className="px-4 py-4"><StatusBadge status={product.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <div className="space-y-6">
                <section className="rounded-lg border border-stone-200 bg-white shadow-soft">
                  <div className="flex items-center justify-between border-b border-stone-200 p-4">
                    <div>
                      <h2 className="text-lg font-semibold text-ink">Recommended moves</h2>
                      <p className="text-sm text-stone-500">Ranked by spread intensity</p>
                    </div>
                    <Filter className="h-5 w-5 text-stone-400" />
                  </div>
                  <div className="divide-y divide-stone-100">
                    {dashboard.opportunities.map((item) => (
                      <div key={item.productId} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-ink">{item.name}</p>
                            <p className="text-sm text-stone-500">{item.sku} / {item.lowestCompetitor.retailer}</p>
                          </div>
                          <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-moss">{item.confidence}%</span>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-stone-500">Now</p>
                            <p className="font-semibold">{money.format(item.ourPrice)}</p>
                          </div>
                          <div>
                            <p className="text-stone-500">Target</p>
                            <p className="font-semibold">{money.format(item.suggestedPrice)}</p>
                          </div>
                          <div>
                            <p className="text-stone-500">Action</p>
                            <p className="font-semibold">{item.action}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-stone-200 bg-white shadow-soft">
                  <div className="flex items-center justify-between border-b border-stone-200 p-4">
                    <div>
                      <h2 className="text-lg font-semibold text-ink">Alert queue</h2>
                      <p className="text-sm text-stone-500">Open competitive events</p>
                    </div>
                    <Signal className="h-5 w-5 text-stone-400" />
                  </div>
                  <div className="divide-y divide-stone-100">
                    {dashboard.alerts.map((alert) => (
                      <div key={alert.id} className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${severityStyles[alert.severity]}`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs font-medium uppercase text-stone-400">{alert.status}</span>
                        </div>
                        <p className="mt-3 font-semibold text-ink">{alert.title}</p>
                        <p className="mt-1 text-sm text-stone-500">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
