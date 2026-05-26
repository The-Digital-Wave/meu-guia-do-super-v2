import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CirclePlay, LogIn, MapPinned, Send, ShoppingCart, Store, Video, Mail, Smartphone, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { loginAdmin, submitContact } from "../lib/api";
import { ResponsiveHeader } from "../components/ResponsiveHeader";

const testimonials = [
  {
    name: "Mariana Duarte",
    role: "Cliente frequente",
    quote: "A rota otimizada transformou minha compra de 50 minutos em 22. A experiência parece GPS, mas dentro do supermercado.",
  },
  {
    name: "Rafael Mello",
    role: "Gerente de operações",
    quote: "A área admin nos permite visualizar e gerenciar o layout da loja de forma eficiente.",
  },
  {
    name: "Paula Goncalves",
    role: "Investidora anjo",
    quote: "A combinação de layout digital, busca de estoque e ordenação de rota tem proposta real de eficiência e recorrência.",
  },
];

const steps = [
  { title: "Escolha o supermercado", description: "Digite o nome do supermercado e carregue instantaneamente o layout da loja na tela do seu smartphone." },
  { title: "Busque seus produtos", description: "Descubra a localização do produto na loja, enquanto acompanha sua posição em tempo real." },
  { title: "Siga o trajeto", description: "O aplicativo te mostra uma linha tracejada que conecta sua posição em tempo real ao item selecionado através da rota mais curta." },
  { title: "Otimize o carrinho", description: "A IA te ajuda a reorganizar os itens da sua lista de compras de maneira a reduzir deslocamentos, economizando tempo e esforço." },
];

export function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [contactState, setContactState] = useState({ name: "", email: "", message: "" });
  const [credentials, setCredentials] = useState({ email: "admin@meuguiadosuper.com", password: "InvestorDemo123" });
  const [loginResult, setLoginResult] = useState<string | null>(null);

  const contactMutation = useMutation({
    mutationFn: submitContact,
    onSuccess: () => {
      setContactState({ name: "", email: "", message: "" });
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginAdmin,
    onSuccess: (session) => {
      setLoginResult(`Autenticado como ${session.admin.name}. Token JWT pronto para proteger o admin.`);
    },
    onError: () => {
      setLoginResult("Falha no login. Verifique se a API e o seed foram executados.");
    },
  });

  return (
    <div className="min-h-screen bg-mist text-ink">
      <ResponsiveHeader
        headerClassName="sticky top-0 z-30 border-b border-white/70 bg-mist/90 backdrop-blur-xl"
        containerClassName="mx-auto max-w-7xl px-6 py-4 lg:px-10"
        mobileTopContent={<Link to="/" className="font-display text-2xl font-semibold">Meu Guia do Super</Link>}
        mobileMenuContent={(
          <>
            <nav className="grid gap-4 text-sm font-semibold uppercase tracking-[0.2em]">
              <a href="#inicio">Home <Store className="h-4 w-4 inline-block" /></a>
              <a href="#demo">Demo <Video className="h-4 w-4 inline-block" /></a>
              <a href="#contato">Contato <Mail className="h-4 w-4 inline-block" /></a>
            </nav>
            <div className="grid gap-4 text-sm font-semibold uppercase tracking-[0.2em]">
              <Link to="/app" className="text-coral">Acessar App <Smartphone className="h-4 w-4 inline-block" /></Link>
              <button type="button" onClick={() => setLoginOpen(true)} className="text-left uppercase">
                Admin <Lock className="h-4 w-4 inline-block" />
              </button>
            </div>
          </>
        )}
        desktopContent={(
          <div className="flex items-center justify-between">
            <Link to="/" className="font-display text-2xl font-semibold">Meu Guia do Super</Link>
            <nav className="flex items-center gap-8 text-sm font-semibold uppercase tracking-[0.2em]">
              <a href="#inicio">Home</a>
              <a href="#demo">Demo</a>
              <a href="#contato">Contato</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link to="/app" className="rounded-full border border-ink px-4 py-2 text-sm font-semibold">Acessar App</Link>
              <button type="button" onClick={() => setLoginOpen(true)} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
                Admin <Lock className="h-4 w-4 inline-block" />
              </button>
            </div>
          </div>
        )}
      />

      <main>
        <section id="inicio" className="relative overflow-hidden px-6 pb-20 pt-16 lg:px-10 lg:pb-28 lg:pt-24">
          <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top_left,_rgba(255,209,102,0.45),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(17,138,178,0.25),_transparent_35%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.4em] text-slate-500">Supermercado inteligente</p>
              <h1 className="max-w-4xl font-display text-5xl leading-tight lg:text-7xl">
                O seu assistente de compras inteligente.
              </h1>
              <h2 className="mt-6 max-w-3xl font-display text-4xl leading-tight lg:text-5xl">
                Menos tempo entre as prateleiras. Mais qualidade de vida.
              </h2>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/app" className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 font-semibold text-white shadow-panel">
                  Acessar App <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#demo" className="inline-flex items-center gap-2 rounded-full border border-ink px-6 py-3 font-semibold">
                  <CirclePlay className="h-4 w-4" /> Assistir demo
                </a>
              </div>
            </motion.div>

            {/* <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1 }} className="relative rounded-[36px] bg-ink p-6 text-white shadow-panel">
              <div className="absolute -left-6 top-10 rounded-full bg-citrus px-4 py-2 text-sm font-semibold text-ink">+18% recorrencia</div>
              <div className="absolute -right-4 bottom-10 rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-ink">-31% tempo medio</div>
              <div className="rounded-[28px] bg-white/10 p-5 backdrop-blur">
                <div className="mb-5 flex items-center justify-between rounded-2xl bg-white/10 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/70">Modo cliente</p>
                    <h3 className="mt-1 text-xl font-semibold">Busca, rota e otimizacao</h3>
                  </div>
                  <MapPinned className="h-8 w-8 text-citrus" />
                </div>
                <div className="grid gap-4">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-white/70">Layout calibrado</p>
                    <p className="mt-2 text-3xl font-semibold">120m x 72m</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <Store className="mb-3 h-5 w-5 text-citrus" />
                      <p className="text-sm text-white/70">Busca por loja</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <ShoppingCart className="mb-3 h-5 w-5 text-citrus" />
                      <p className="text-sm text-white/70">Carrinho otimizado</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div> */}
            <div className="grid h-full w-full place-items-center text-center">
              <img src="/landing/hero.png" alt="Etapa 4" className="h-full w-full rounded-[20px] object-cover" />
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white/50 py-6">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-10 px-6 text-sm font-semibold uppercase tracking-[0.35em] text-slate-500 lg:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-coral">Nossos Parceiros</p>
            <span>Super Nosso</span>
            <span>Supermercardos BH</span>
            <span>Verdemar</span>
            <span>Atacado Central</span>
            <span>Urban Foods</span>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="mb-12 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-coral">Como funciona</p>
            <h2 className="mt-3 font-display text-4xl">Uma jornada guiada durante toda a experiência de compra.</h2>
          </div>
          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div key={step.title} initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className={`grid gap-6 rounded-[32px] bg-white p-8 shadow-panel lg:grid-cols-2 ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                <div className="rounded-[28px] bg-gradient-to-br from-ink to-sea p-8 text-white">
                  <p className="text-sm uppercase tracking-[0.35em] text-white/70">Etapa {index + 1}</p>
                  <h3 className="mt-4 font-display text-3xl">{step.title}</h3>
                  <p className="mt-4 text-white/80">{step.description}</p>
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-mist p-8">
                  <div className="grid h-full place-items-center rounded-[24px] border border-dashed border-slate-300 bg-white">
                    <div className="grid h-full w-full place-items-center text-center">
                      {index === 0 && <img src="/landing/etapa-1.png" alt="Etapa 1" className="h-full w-full rounded-[20px] object-cover" />}
                      {index === 1 && <img src="/landing/etapa-2.png" alt="Etapa 2" className="h-full w-full rounded-[20px] object-cover" />}
                      {index === 2 && <img src="/landing/etapa-3.png" alt="Etapa 3" className="h-full w-full rounded-[20px] object-cover" />}
                      {index === 3 && <img src="/landing/etapa-4.png" alt="Etapa 4" className="h-full w-full rounded-[20px] object-cover" />}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="demo" className="bg-ink px-6 py-20 text-white lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="flex flex-col justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-citrus">Demo</p>
              <h2 className="mt-8 font-display text-4xl">Veja como o app transforma sua compra em uma jornada rápida e sem estresse</h2>
              <p className="mt-6 text-white/80">Meu Guia do Super identifica onde cada item está, monta a rota mais curta pelos corredores e reduz deslocamentos desnecessários, ajudando você a economizar seu tempo e esforço.</p>
            </div>
            <div className="overflow-hidden rounded-[36px] border border-white/10 bg-white/10 p-4">
              <div className="grid aspect-video place-items-center rounded-[28px] bg-[linear-gradient(135deg,rgba(255,209,102,0.22),rgba(239,71,111,0.18),rgba(17,138,178,0.22))]">
                {/* <div className="text-center">
                  <CirclePlay className="mx-auto h-16 w-16 text-citrus" />
                  <p className="mt-4 text-lg font-semibold">Substitua por um iframe do Loom, Vimeo ou YouTube</p>
                </div> */}
                <video className="w-full min-h-[480px] rounded-lg shadow-lg" controls>
            <source src="/landing/app-demo.mp4" type="video/mp4" />
            Seu navegador não suporta vídeo.
          </video>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-coral">Prova social</p>
              <h2 className="mt-3 font-display text-4xl">O que dizem os nossos  usuários</h2>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="flex h-[275px] flex-col rounded-[28px] bg-white p-6 shadow-panel">
                <p className="flex-1 text-lg text-slate-700">“{testimonial.quote}”</p>
                <div className="mt-6 h-16 border-t border-slate-200 pt-4">
                  <p className="font-semibold text-ink">{testimonial.name}</p>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="contato" className="bg-white px-6 py-20 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <img src="/landing/contact-form.png" alt="Contato" className="h-full w-full rounded-[20px] object-cover" />
            </div>
            <div className="grid gap-10">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-coral">Contato</p>
                <h2 className="mt-3 font-display text-4xl">Interessado? Leve essa experiência para a sua rede</h2>
                <p className="mt-4 text-slate-600">Use o formulário abaixo para entrar em contato conosco.</p>
              </div>
              <form
                className="rounded-[32px] bg-mist p-8 shadow-panel"
                onSubmit={(event) => {
                  event.preventDefault();
                  contactMutation.mutate(contactState);
                }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <input value={contactState.name} onChange={(event) => setContactState((state) => ({ ...state, name: event.target.value }))} placeholder="Seu nome" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
                  <input value={contactState.email} onChange={(event) => setContactState((state) => ({ ...state, email: event.target.value }))} placeholder="Seu melhor email" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
                </div>
                <textarea value={contactState.message} onChange={(event) => setContactState((state) => ({ ...state, message: event.target.value }))} placeholder="Conte-nos como podemos te ajudar" rows={6} className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
                <button type="submit" disabled={contactMutation.isPending} className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-white">
                  <Send className="h-4 w-4" /> Enviar mensagem
                </button>
                {contactMutation.isSuccess ? <p className="mt-4 text-sm text-leaf">Mensagem enviada com sucesso.</p> : null}
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 px-6 py-6 text-sm text-slate-500 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 lg:flex-row">
          <span>Meu Guia do Super</span>
          <div className="flex gap-4">
            <Link to="/app">Cliente</Link>
            <Link to="/admin">Admin</Link>
          </div>
        </div>
      </footer>

      {loginOpen ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/50 p-6">
          <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-panel">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Admin login</p>
                <h3 className="font-display text-3xl text-ink">Entrar para editar layouts</h3>
              </div>
              <button type="button" onClick={() => setLoginOpen(false)} className="rounded-full border border-slate-300 px-3 py-1">Fechar</button>
            </div>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                loginMutation.mutate(credentials);
              }}
            >
              <input value={credentials.email} onChange={(event) => setCredentials((state) => ({ ...state, email: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
              <input type="password" value={credentials.password} onChange={(event) => setCredentials((state) => ({ ...state, password: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
              <button type="submit" disabled={loginMutation.isPending} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-semibold text-white">
                <LogIn className="h-4 w-4" /> Validar API
              </button>
            </form>
            {loginResult ? <p className="mt-4 text-sm text-slate-600">{loginResult}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
