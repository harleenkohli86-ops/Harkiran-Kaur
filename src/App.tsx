import React, { useState } from 'react';
import { PageId } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FloatingButtons } from './components/FloatingButtons';
import { JoinMentorshipModal, BookCounsellingModal } from './components/Modals';
import { StudentSystemGuideModal } from './components/StudentSystemGuideModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { ThankYouModal } from './components/ThankYouModal';

import { HomePage } from './pages/HomePage';
import { AboutHKPage, FounderPage, VisionMissionPage, WhyChoosePage } from './pages/AboutPages';
import { ProgramsPage, CSEETPage, CSExecutivePage, CSProfessionalPage, TestSeriesPage } from './pages/CoursePages';
import { ResultsPage, TestimonialsPage, FreeResourcesPage, BlogPage, FAQPage, ContactPage, LegalPages } from './pages/ResourcePages';
import { AdminPage } from './pages/AdminPage';
import { StudentPortalPage } from './pages/StudentPortalPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [counsellingModalOpen, setCounsellingModalOpen] = useState(false);
  const [systemGuideOpen, setSystemGuideOpen] = useState(false);

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#1C1917] font-poppins flex flex-col selection:bg-[#C8A45D] selection:text-black">
      {/* Sticky Luxury Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenJoinModal={() => setJoinModalOpen(true)}
        onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
        onOpenSystemGuide={() => setSystemGuideOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-grow">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
          />
        )}

        {currentPage === 'about-hk' && (
          <AboutHKPage
            onNavigate={handleNavigate}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
          />
        )}

        {currentPage === 'founder' && (
          <FounderPage
            onNavigate={handleNavigate}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
          />
        )}

        {currentPage === 'vision-mission' && (
          <VisionMissionPage
            onNavigate={handleNavigate}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
          />
        )}

        {currentPage === 'why-choose' && (
          <WhyChoosePage
            onNavigate={handleNavigate}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
          />
        )}

        {currentPage === 'programs' && (
          <ProgramsPage
            onNavigate={handleNavigate}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
          />
        )}

        {currentPage === 'cseet' && (
          <CSEETPage
            onNavigate={handleNavigate}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
          />
        )}

        {currentPage === 'cs-executive' && (
          <CSExecutivePage
            onNavigate={handleNavigate}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
          />
        )}

        {currentPage === 'cs-professional' && (
          <CSProfessionalPage
            onNavigate={handleNavigate}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
          />
        )}

        {currentPage === 'test-series' && (
          <TestSeriesPage
            onNavigate={handleNavigate}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
          />
        )}

        {currentPage === 'results' && (
          <ResultsPage
            onNavigate={handleNavigate}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
          />
        )}

        {currentPage === 'testimonials' && (
          <TestimonialsPage
            onNavigate={handleNavigate}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
          />
        )}

        {currentPage === 'resources' && (
          <FreeResourcesPage
            onNavigate={handleNavigate}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
          />
        )}

        {currentPage === 'blog' && (
          <BlogPage
            onNavigate={handleNavigate}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
          />
        )}

        {currentPage === 'faq' && (
          <FAQPage
            onNavigate={handleNavigate}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
          />
        )}

        {currentPage === 'contact' && (
          <ContactPage
            onNavigate={handleNavigate}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
          />
        )}

        {(currentPage === 'privacy' || currentPage === 'terms') && (
          <LegalPages type={currentPage} />
        )}

        {/* FAQ and Help Desk */}
        {currentPage === 'forum' && (
          <FAQPage
            onNavigate={handleNavigate}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
          />
        )}

        {/* Master Admin Portal */}
        {currentPage === 'admin' && (
          <AdminPage onNavigate={handleNavigate} />
        )}

        {/* Student Learning Portal */}
        {currentPage === 'student-portal' && (
          <StudentPortalPage
            onNavigate={handleNavigate}
            onOpenJoinModal={() => setJoinModalOpen(true)}
            onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
          />
        )}
      </main>

      {/* Floating Action Buttons */}
      <FloatingButtons
        currentPage={currentPage}
        onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
        onOpenJoinModal={() => setJoinModalOpen(true)}
      />

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenCounsellingModal={() => setCounsellingModalOpen(true)}
      />

      {/* Modals */}
      <JoinMentorshipModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />

      <BookCounsellingModal
        isOpen={counsellingModalOpen}
        onClose={() => setCounsellingModalOpen(false)}
      />

      <StudentSystemGuideModal
        isOpen={systemGuideOpen}
        onClose={() => setSystemGuideOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Cart, Checkout & Auth Modals */}
      <CartDrawer />
      <CheckoutModal />
      <AuthModal onNavigate={handleNavigate} />
      <ThankYouModal onNavigate={handleNavigate} />
    </div>
  );
}
