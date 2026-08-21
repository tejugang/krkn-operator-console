/**
 * JobSummaryDownload Component Tests
 *
 * Tests the JobSummaryDownload component's ability to:
 * - Show/hide based on job completion status
 * - Download PDF and HTML summaries
 * - Handle errors gracefully
 * - Display loading states
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobSummaryDownload } from '../JobSummaryDownload';
import { operatorApi } from '../../services/operatorApi';

// Mock the operatorApi
vi.mock('../../services/operatorApi', () => ({
  operatorApi: {
    downloadJobSummary: vi.fn(),
  },
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock HTMLAnchorElement.click
HTMLAnchorElement.prototype.click = vi.fn();

describe('JobSummaryDownload', () => {
  const mockProps = {
    scenarioRunName: 'test-run-12345678',
    jobId: 'job-abc123',
    status: 'Succeeded',
    podName: 'krkn-test-pod',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Visibility', () => {
    it('should render when job status is Succeeded', () => {
      render(<JobSummaryDownload {...mockProps} status="Succeeded" />);
      expect(screen.getByRole('button', { name: /download summary/i })).toBeInTheDocument();
    });

    it('should render when job status is Failed', () => {
      render(<JobSummaryDownload {...mockProps} status="Failed" />);
      expect(screen.getByRole('button', { name: /download summary/i })).toBeInTheDocument();
    });

    it('should not render when job status is Pending', () => {
      render(<JobSummaryDownload {...mockProps} status="Pending" />);
      expect(screen.queryByRole('button', { name: /download summary/i })).not.toBeInTheDocument();
    });

    it('should not render when job status is Running', () => {
      render(<JobSummaryDownload {...mockProps} status="Running" />);
      expect(screen.queryByRole('button', { name: /download summary/i })).not.toBeInTheDocument();
    });
  });

  describe('Dropdown mode (default)', () => {
    it('should open dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<JobSummaryDownload {...mockProps} />);

      const button = screen.getByRole('button', { name: /download summary/i });
      await user.click(button);

      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('HTML')).toBeInTheDocument();
    });

    it('should download PDF when PDF option is selected', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['test pdf content'], { type: 'application/pdf' });
      vi.mocked(operatorApi.downloadJobSummary).mockResolvedValue(mockBlob);

      render(<JobSummaryDownload {...mockProps} />);

      const button = screen.getByRole('button', { name: /download summary/i });
      await user.click(button);

      const pdfOption = screen.getByText('PDF');
      await user.click(pdfOption);

      await waitFor(() => {
        expect(operatorApi.downloadJobSummary).toHaveBeenCalledWith(
          'test-run-12345678',
          'job-abc123',
          'pdf'
        );
      });

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    });

    it('should download HTML when HTML option is selected', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['<html>test</html>'], { type: 'text/html' });
      vi.mocked(operatorApi.downloadJobSummary).mockResolvedValue(mockBlob);

      render(<JobSummaryDownload {...mockProps} />);

      const button = screen.getByRole('button', { name: /download summary/i });
      await user.click(button);

      const htmlOption = screen.getByText('HTML');
      await user.click(htmlOption);

      await waitFor(() => {
        expect(operatorApi.downloadJobSummary).toHaveBeenCalledWith(
          'test-run-12345678',
          'job-abc123',
          'html'
        );
      });

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    });
  });

  describe('Button mode (non-dropdown)', () => {
    it('should render as single button when dropdown=false', () => {
      render(<JobSummaryDownload {...mockProps} dropdown={false} />);
      const button = screen.getByRole('button', { name: /download summary as pdf/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Summary');
    });

    it('should download PDF when clicked in button mode', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['test pdf content'], { type: 'application/pdf' });
      vi.mocked(operatorApi.downloadJobSummary).mockResolvedValue(mockBlob);

      render(<JobSummaryDownload {...mockProps} dropdown={false} />);

      const button = screen.getByRole('button', { name: /download summary as pdf/i });
      await user.click(button);

      await waitFor(() => {
        expect(operatorApi.downloadJobSummary).toHaveBeenCalledWith(
          'test-run-12345678',
          'job-abc123',
          'pdf'
        );
      });
    });
  });

  describe('Error handling', () => {
    it('should display error alert when download fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Summary not available — the run may still be in progress or the pod has been cleaned up';
      vi.mocked(operatorApi.downloadJobSummary).mockRejectedValue(new Error(errorMessage));

      render(<JobSummaryDownload {...mockProps} />);

      const button = screen.getByRole('button', { name: /download summary/i });
      await user.click(button);

      const pdfOption = screen.getByText('PDF');
      await user.click(pdfOption);

      await waitFor(() => {
        expect(screen.getByText('Download failed')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should close error alert when close button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(operatorApi.downloadJobSummary).mockRejectedValue(new Error('Test error'));

      render(<JobSummaryDownload {...mockProps} />);

      const button = screen.getByRole('button', { name: /download summary/i });
      await user.click(button);

      const pdfOption = screen.getByText('PDF');
      await user.click(pdfOption);

      await waitFor(() => {
        expect(screen.getByText('Download failed')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText(/close/i);
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Download failed')).not.toBeInTheDocument();
      });
    });

    it('should handle non-Error exceptions gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(operatorApi.downloadJobSummary).mockRejectedValue('String error');

      render(<JobSummaryDownload {...mockProps} />);

      const button = screen.getByRole('button', { name: /download summary/i });
      await user.click(button);

      const pdfOption = screen.getByText('PDF');
      await user.click(pdfOption);

      await waitFor(() => {
        expect(screen.getByText('Failed to download summary')).toBeInTheDocument();
      });
    });
  });

  describe('Loading state', () => {
    it('should disable button while downloading', async () => {
      const user = userEvent.setup();
      let resolveDownload: (value: Blob) => void;
      const downloadPromise = new Promise<Blob>((resolve) => {
        resolveDownload = resolve;
      });
      vi.mocked(operatorApi.downloadJobSummary).mockReturnValue(downloadPromise);

      render(<JobSummaryDownload {...mockProps} />);

      const button = screen.getByRole('button', { name: /download summary/i });
      await user.click(button);

      const pdfOption = screen.getByText('PDF');
      await user.click(pdfOption);

      // Button should be disabled during download
      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      // Resolve the download
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      resolveDownload!(mockBlob);

      // Button should be enabled after download
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should show "Downloading..." text in button mode', async () => {
      const user = userEvent.setup();
      let resolveDownload: (value: Blob) => void;
      const downloadPromise = new Promise<Blob>((resolve) => {
        resolveDownload = resolve;
      });
      vi.mocked(operatorApi.downloadJobSummary).mockReturnValue(downloadPromise);

      render(<JobSummaryDownload {...mockProps} dropdown={false} />);

      const button = screen.getByRole('button', { name: /download summary as pdf/i });
      await user.click(button);

      // Should show "Downloading..." text
      await waitFor(() => {
        expect(screen.getByText('Downloading...')).toBeInTheDocument();
      });

      // Resolve the download
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      resolveDownload!(mockBlob);

      // Should return to normal text
      await waitFor(() => {
        expect(screen.getByText('Summary')).toBeInTheDocument();
      });
    });
  });

  describe('File naming', () => {
    it('should create correct filename for PDF', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      vi.mocked(operatorApi.downloadJobSummary).mockResolvedValue(mockBlob);

      // Mock createElement to capture the download attribute
      const createElementSpy = vi.spyOn(document, 'createElement');

      render(<JobSummaryDownload {...mockProps} podName="my-test-pod" />);

      const button = screen.getByRole('button', { name: /download summary/i });
      await user.click(button);

      const pdfOption = screen.getByText('PDF');
      await user.click(pdfOption);

      await waitFor(() => {
        const calls = createElementSpy.mock.calls;
        const anchorCall = calls.find(call => call[0] === 'a');
        expect(anchorCall).toBeDefined();
      });

      // Check that download attribute was set correctly
      await waitFor(() => {
        const anchor = createElementSpy.mock.results.find(
          result => result.value instanceof HTMLAnchorElement
        )?.value as HTMLAnchorElement;
        expect(anchor?.download).toBe('summary-my-test-pod.pdf');
      });

      createElementSpy.mockRestore();
    });

    it('should create correct filename for HTML', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['test'], { type: 'text/html' });
      vi.mocked(operatorApi.downloadJobSummary).mockResolvedValue(mockBlob);

      const createElementSpy = vi.spyOn(document, 'createElement');

      render(<JobSummaryDownload {...mockProps} podName="my-test-pod" />);

      const button = screen.getByRole('button', { name: /download summary/i });
      await user.click(button);

      const htmlOption = screen.getByText('HTML');
      await user.click(htmlOption);

      await waitFor(() => {
        const anchor = createElementSpy.mock.results.find(
          result => result.value instanceof HTMLAnchorElement
        )?.value as HTMLAnchorElement;
        expect(anchor?.download).toBe('summary-my-test-pod.html');
      });

      createElementSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should revoke object URL after download', async () => {
      const user = userEvent.setup();
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      vi.mocked(operatorApi.downloadJobSummary).mockResolvedValue(mockBlob);

      render(<JobSummaryDownload {...mockProps} />);

      const button = screen.getByRole('button', { name: /download summary/i });
      await user.click(button);

      const pdfOption = screen.getByText('PDF');
      await user.click(pdfOption);

      await waitFor(() => {
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      });
    });
  });
});
