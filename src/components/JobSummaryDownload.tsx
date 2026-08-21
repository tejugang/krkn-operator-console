/**
 * JobSummaryDownload Component
 *
 * Provides a button/dropdown to download job summary reports in PDF or HTML format.
 * Only visible when the job has completed (status is 'Succeeded' or 'Failed').
 */

import { useState } from 'react';
import {
  Button,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  Alert,
  AlertGroup,
  AlertActionCloseButton,
} from '@patternfly/react-core';
import { DownloadIcon } from '@patternfly/react-icons';
import { operatorApi } from '../services/operatorApi';

interface JobSummaryDownloadProps {
  /** Scenario run name */
  scenarioRunName: string;
  /** Job ID */
  jobId: string;
  /** Job status (used to determine if download is available) */
  status: string;
  /** Pod name (used for filename) */
  podName: string;
  /** Show as dropdown (true) or single button with format (false) */
  dropdown?: boolean;
}

export function JobSummaryDownload({
  scenarioRunName,
  jobId,
  status,
  podName,
  dropdown = true,
}: JobSummaryDownloadProps) {
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCompleted = status === 'Succeeded' || status === 'Failed';

  const handleDownload = async (format: 'pdf' | 'html') => {
    try {
      setIsDownloading(true);
      setErrorMessage(null);
      setIsDownloadOpen(false);

      const blob = await operatorApi.downloadJobSummary(scenarioRunName, jobId, format);

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `summary-${podName}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to download summary');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCloseError = () => {
    setErrorMessage(null);
  };

  if (!isCompleted) {
    return null;
  }

  return (
    <>
      <AlertGroup isToast isLiveRegion>
        {errorMessage && (
          <Alert
            variant="warning"
            title="Download failed"
            actionClose={<AlertActionCloseButton onClose={handleCloseError} />}
          >
            {errorMessage}
          </Alert>
        )}
      </AlertGroup>

      {dropdown ? (
        <Dropdown
          isOpen={isDownloadOpen}
          onOpenChange={(isOpen) => setIsDownloadOpen(isOpen)}
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              variant="default"
              ref={toggleRef}
              aria-label="Download summary"
              onClick={() => setIsDownloadOpen(!isDownloadOpen)}
              isExpanded={isDownloadOpen}
              isDisabled={isDownloading}
            >
              <DownloadIcon /> Summary
            </MenuToggle>
          )}
          shouldFocusToggleOnSelect
        >
          <DropdownList>
            <DropdownItem key="pdf" onClick={() => handleDownload('pdf')}>
              PDF
            </DropdownItem>
            <DropdownItem key="html" onClick={() => handleDownload('html')}>
              HTML
            </DropdownItem>
          </DropdownList>
        </Dropdown>
      ) : (
        <Button
          variant="control"
          icon={<DownloadIcon />}
          onClick={() => handleDownload('pdf')}
          isDisabled={isDownloading}
          aria-label="Download summary as PDF"
        >
          {isDownloading ? 'Downloading...' : 'Summary'}
        </Button>
      )}
    </>
  );
}
