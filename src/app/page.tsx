import { Chat } from "@/components/chat/chat";
import { getDefaultCustomer } from "@/lib/data/customers";
import { WalletIcon, ShieldCheckIcon, SmartphoneIcon } from "lucide-react";

export default function Home() {
  const customer = getDefaultCustomer();

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] overflow-hidden bg-background">
      {/* Sidebar / Branding (Hidden on mobile, side by side on desktop) */}
      <div className="hidden lg:flex flex-col w-[350px] p-8 border-r bg-card relative overflow-hidden z-10">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-0 w-full h-[300px] bg-primary/10 blur-[100px] -z-10 rounded-full" />
        
        <div className="flex items-center gap-2 mb-12">
          <div className="size-8 bg-primary rounded-xl flex items-center justify-center rotate-3 shadow-lg shadow-primary/20">
            <span className="font-bold text-primary-foreground text-lg tracking-tighter">B</span>
          </div>
          <span className="font-bold text-xl tracking-tight">Bankmate</span>
        </div>

        <div className="mt-auto">
          <h1 className="text-3xl font-bold tracking-tighter mb-4 text-balance">
            Welcome back, <br/>
            <span className="text-primary">{customer.name.split(" ")[0]}</span>
          </h1>
          <p className="text-muted-foreground text-sm mb-8 text-balance leading-relaxed">
            I'm your personal AI banking assistant. You can ask me to check your balance, analyze your spending, or compare our banking products.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheckIcon className="size-4" />
              </div>
              Bank-grade security
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <WalletIcon className="size-4" />
              </div>
              Real-time insights
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <SmartphoneIcon className="size-4" />
              </div>
              24/7 availability
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full p-0 sm:p-4 md:p-6 lg:p-8 bg-muted/20">
        {/* Mobile Header (Only visible on small screens) */}
        <div className="flex lg:hidden items-center gap-2 px-4 py-3 border-b bg-card">
          <div className="size-6 bg-primary rounded-lg flex items-center justify-center shadow-sm">
            <span className="font-bold text-primary-foreground text-xs">B</span>
          </div>
          <span className="font-semibold tracking-tight text-sm">Bankmate</span>
        </div>
        
        {/* Chat Container */}
        <div className="flex-1 min-h-0 w-full max-w-4xl mx-auto shadow-2xl shadow-black/5 rounded-none sm:rounded-xl overflow-hidden border-0 sm:border">
          <Chat />
        </div>
      </main>
    </div>
  );
}
