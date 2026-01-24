import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Loader2, Building2, Shield, Mail, KeyRound, ArrowLeft, Sparkles } from 'lucide-react';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AuthView = 'main' | 'forgot-password' | 'magic-link';

export default function Auth() {
  const location = useLocation();
  const isAdminMode = location.pathname === '/auth/admin';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authView, setAuthView] = useState<AuthView>('main');
  const [rememberMe, setRememberMe] = useState(true);
  const [recoveryEmailSent, setRecoveryEmailSent] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for remember me preference on mount
  useEffect(() => {
    const savedRememberMe = localStorage.getItem('rememberMe');
    if (savedRememberMe !== null) {
      setRememberMe(savedRememberMe === 'true');
    }
  }, []);

  const validateForm = (isSignUp: boolean) => {
    const newErrors: Record<string, string> = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    if (authView === 'main') {
      try {
        passwordSchema.parse(password);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.password = e.errors[0].message;
        }
      }
    }
    
    if (isSignUp && !fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;
    
    // Save remember me preference
    localStorage.setItem('rememberMe', rememberMe.toString());
    
    setIsLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.'
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      navigate(isAdminMode ? '/admin' : '/partner');
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;
    
    setIsLoading(true);
    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      let message = error.message;
      if (message.includes('already registered')) {
        message = 'An account with this email already exists. Please sign in instead.';
      }
      toast({
        title: 'Sign up failed',
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Account created!',
        description: 'Welcome to the Partner Portal.',
      });
      navigate('/partner');
    }
    setIsLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors({ email: err.errors[0].message });
        return;
      }
    }
    
    setIsLoading(true);
    const redirectUrl = `${window.location.origin}/auth/${isAdminMode ? 'admin' : 'partner'}`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    if (error) {
      toast({
        title: 'Reset failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setRecoveryEmailSent(true);
      toast({
        title: 'Recovery email sent',
        description: 'Check your inbox for the password reset link.',
      });
    }
    setIsLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors({ email: err.errors[0].message });
        return;
      }
    }
    
    setIsLoading(true);
    const redirectUrl = `${window.location.origin}/${isAdminMode ? 'admin' : 'partner'}`;
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    
    if (error) {
      toast({
        title: 'Magic link failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setMagicLinkSent(true);
      toast({
        title: 'Magic link sent',
        description: 'Check your inbox for the login link.',
      });
    }
    setIsLoading(false);
  };

  const resetView = () => {
    setAuthView('main');
    setRecoveryEmailSent(false);
    setMagicLinkSent(false);
    setErrors({});
  };

  // Forgot Password View
  if (authView === 'forgot-password') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-border/50 shadow-lg" style={{ borderRadius: '0px' }}>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 flex items-center justify-center" style={{ backgroundColor: '#1ABC9C', borderRadius: '0px' }}>
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Password Recovery</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {recoveryEmailSent 
                    ? "We've sent you a recovery link" 
                    : "Enter your email to receive a reset link"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {recoveryEmailSent ? (
                <div className="space-y-4 text-center">
                  <div className="p-4 bg-[#1ABC9C]/10 border border-[#1ABC9C]/20" style={{ borderRadius: '0px' }}>
                    <Mail className="w-8 h-8 mx-auto mb-2" style={{ color: '#1ABC9C' }} />
                    <p className="text-sm text-muted-foreground">
                      Check your inbox at <strong>{email}</strong> for the password reset link.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={resetView} 
                    className="w-full"
                    style={{ borderRadius: '0px' }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recovery-email">Email Address</Label>
                    <Input
                      id="recovery-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={errors.email ? 'border-destructive' : ''}
                      style={{ borderRadius: '0px' }}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                    style={{ borderRadius: '0px', backgroundColor: '#1ABC9C' }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Recovery Link
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={resetView} 
                    className="w-full"
                    style={{ borderRadius: '0px' }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Magic Link View
  if (authView === 'magic-link') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-border/50 shadow-lg" style={{ borderRadius: '0px' }}>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 flex items-center justify-center" style={{ backgroundColor: '#3498DB', borderRadius: '0px' }}>
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Passwordless Login</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {magicLinkSent 
                    ? "Check your email for the magic link" 
                    : "Sign in instantly with a magic link"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {magicLinkSent ? (
                <div className="space-y-4 text-center">
                  <div className="p-4 bg-[#3498DB]/10 border border-[#3498DB]/20" style={{ borderRadius: '0px' }}>
                    <Mail className="w-8 h-8 mx-auto mb-2" style={{ color: '#3498DB' }} />
                    <p className="text-sm text-muted-foreground">
                      We've sent a magic link to <strong>{email}</strong>. Click it to sign in instantly.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={resetView} 
                    className="w-full"
                    style={{ borderRadius: '0px' }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="magic-email">Email Address</Label>
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={errors.email ? 'border-destructive' : ''}
                      style={{ borderRadius: '0px' }}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                    style={{ borderRadius: '0px', backgroundColor: '#3498DB' }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Send Magic Link
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={resetView} 
                    className="w-full"
                    style={{ borderRadius: '0px' }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Auth View
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="flex-1 flex items-center justify-center p-4">
        <Card 
          className={`w-full max-w-md border-border/50 shadow-lg transition-all duration-300 ${isAdminMode ? 'border-primary/30 shadow-primary/10' : ''}`}
          style={{ borderRadius: '0px' }}
        >
          <CardHeader className="text-center space-y-4">
            <div 
              className={`mx-auto w-12 h-12 flex items-center justify-center transition-colors duration-300`}
              style={{ 
                backgroundColor: isAdminMode ? '#1ABC9C' : 'hsl(var(--primary) / 0.1)',
                borderRadius: '0px'
              }}
            >
              {isAdminMode ? (
                <Shield className="w-6 h-6 text-white" />
              ) : (
                <Building2 className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {isAdminMode ? 'Admin Portal' : 'Partner Portal'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {isAdminMode ? 'Internal Staff Access' : 'Creative Command Center'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isAdminMode ? (
              // Admin Login - Sign In Only
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                    style={{ borderRadius: '0px' }}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? 'border-destructive' : ''}
                    style={{ borderRadius: '0px' }}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
                
                {/* Remember Me & Recovery Options */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember-me" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    <Label htmlFor="remember-me" className="text-sm text-muted-foreground cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                  style={{ borderRadius: '0px', backgroundColor: '#1ABC9C' }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Access Dashboard
                    </>
                  )}
                </Button>
                
                {/* Recovery Options */}
                <div className="pt-4 border-t border-border/50 space-y-2">
                  <p className="text-xs text-center text-muted-foreground mb-3">
                    Account Recovery Options
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => setAuthView('forgot-password')}
                      style={{ borderRadius: '0px' }}
                    >
                      <KeyRound className="mr-1 h-3 w-3" />
                      Reset Password
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => setAuthView('magic-link')}
                      style={{ borderRadius: '0px' }}
                    >
                      <Sparkles className="mr-1 h-3 w-3" />
                      Magic Link
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs text-center text-muted-foreground mt-4">
                  For internal staff only. Unauthorized access is prohibited.
                </p>
              </form>
            ) : (
              // Partner Login/Signup Tabs
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6" style={{ borderRadius: '0px' }}>
                  <TabsTrigger value="signin" style={{ borderRadius: '0px' }}>Sign In</TabsTrigger>
                  <TabsTrigger value="signup" style={{ borderRadius: '0px' }}>Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="partner@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={errors.email ? 'border-destructive' : ''}
                        style={{ borderRadius: '0px' }}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={errors.password ? 'border-destructive' : ''}
                        style={{ borderRadius: '0px' }}
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password}</p>
                      )}
                    </div>
                    
                    {/* Remember Me */}
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="partner-remember-me" 
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                      />
                      <Label htmlFor="partner-remember-me" className="text-sm text-muted-foreground cursor-pointer">
                        Remember me
                      </Label>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                      style={{ borderRadius: '0px' }}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                    
                    {/* Recovery Options */}
                    <div className="flex justify-center gap-4 text-sm">
                      <button 
                        type="button"
                        onClick={() => setAuthView('forgot-password')}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        Forgot password?
                      </button>
                      <span className="text-muted-foreground">•</span>
                      <button 
                        type="button"
                        onClick={() => setAuthView('magic-link')}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        Use magic link
                      </button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Smith"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={errors.fullName ? 'border-destructive' : ''}
                        style={{ borderRadius: '0px' }}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="partner@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={errors.email ? 'border-destructive' : ''}
                        style={{ borderRadius: '0px' }}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={errors.password ? 'border-destructive' : ''}
                        style={{ borderRadius: '0px' }}
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password}</p>
                      )}
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                      style={{ borderRadius: '0px' }}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
