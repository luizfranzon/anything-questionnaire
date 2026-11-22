import { DomainError } from "../../domain/errors";
import { validateStudyDetails, type Study, type StudyDetails } from "../../domain/study";
import type { StudyRepository } from "../ports/study-repository";

export function createStudyUseCases(studies: StudyRepository) {
  return {
    async createStudy(input: StudyDetails): Promise<Study> {
      return studies.insert(validateStudyDetails(input));
    },

    listStudies(): Promise<Study[]> {
      return studies.findAll();
    },

    getStudy(id: string): Promise<Study | null> {
      return studies.findById(id);
    },

    async updateStudy(id: string, input: StudyDetails): Promise<Study> {
      const updated = await studies.update(id, validateStudyDetails(input));
      if (!updated) throw new DomainError("STUDY_NOT_FOUND");
      return updated;
    },

    deleteStudy(id: string): Promise<void> {
      return studies.delete(id);
    },
  };
}
